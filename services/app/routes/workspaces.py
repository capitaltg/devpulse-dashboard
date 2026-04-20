"""
Workspace API routes.
Handles workspace creation and management.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.models import InternalUser
from app.utils import (
    add_workspace_member,
    create_workspace,
    create_workspace_token,
    delete_workspace,
    get_current_user,
    get_user_by_username,
    get_user_workspaces,
    get_workspace_by_external_id,
    get_workspace_members,
    get_workspace_tokens,
    remove_workspace_member,
    revoke_workspace_token,
    upsert_external_user,
)
from app.utils.github_utils import fetch_github_user
from app.utils.workspace import get_authorized_workspace_id

router = APIRouter(prefix="/v1/workspaces", tags=["workspaces"])

logger = logging.getLogger(__name__)


class CreateWorkspaceRequest(BaseModel):
    description: str


class CreateWorkspaceTokenRequest(BaseModel):
    description: str


class AddWorkspaceMemberRequest(BaseModel):
    """Request model for adding a member to a workspace"""

    username: str = Field(..., description="Username of the user to add")
    relationship: str = Field(
        default="member",
        description="Relationship type: 'member' or 'owner'",
        pattern="^(member|owner)$",
    )


@router.get("")
def get_my_workspaces(user: InternalUser = Depends(get_current_user)):
    """Get all workspaces the current user is a member of."""
    workspaces = get_user_workspaces(user.id)
    return {
        "workspaces": workspaces,
    }


@router.get("/{external_id}")
def get_workspace(external_id: str, user: InternalUser = Depends(get_current_user)):
    """Get workspace details by external ID."""
    workspace = get_workspace_by_external_id(external_id)

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workspace with external_id '{external_id}' not found",
        )

    return {
        "workspace": workspace,
    }


@router.post("")
def create_new_workspace(
    payload: CreateWorkspaceRequest,
    user: InternalUser = Depends(get_current_user),
):
    """Create a workspace for the current user."""
    description = payload.description.strip()
    if not description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description is required",
        )

    logging.info(
        f"User {user.username} is creating a workspace with description: '{description}'"
    )
    workspace = create_workspace(description=description, creator_id=user.id)
    return {
        "data": {
            **workspace.model_dump(),
            "relationship": "owner",
        },
    }


@router.get("/{external_workspace_id}/members")
def get_members(
    user: InternalUser = Depends(get_current_user),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
):

    members = get_workspace_members(internal_workspace_id)
    return {
        "data": members,
    }


@router.post("/{external_workspace_id}/members")
def add_member(
    external_workspace_id: str,
    request: AddWorkspaceMemberRequest,
    user: InternalUser = Depends(get_current_user),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
):

    # Look up user by username
    member_user = get_user_by_username(request.username)
    if not member_user:
        # Fall back to GitHub public API to check if the username exists
        github_data = fetch_github_user(request.username)
        if github_data:
            upsert_external_user(github_data)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    f"GitHub user '{request.username}' exists but has not yet logged into this dashboard. "
                    "They must sign in before they can be added as a member."
                ),
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{request.username}' was not found locally or on GitHub",
        )

    # Add the member
    member = add_workspace_member(
        workspace_id=internal_workspace_id,
        user_id=member_user.id,
        relationship=request.relationship,
    )

    logging.info(
        f"User {user.username} added {request.username} to workspace {external_workspace_id} as {request.relationship}"
    )
    return {
        "message": f"User {request.username} added to workspace {external_workspace_id} as {request.relationship}",
        "member": member,
    }


@router.delete("/{external_workspace_id}/members/{user_id}")
def remove_member(
    external_workspace_id: str,
    user_id: int,
    user: InternalUser = Depends(get_current_user),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
):
    """Remove a member from a workspace. Only owners may do this."""
    members = get_workspace_members(internal_workspace_id)
    caller = next((m for m in members if m["id"] == user.id), None)
    if not caller or caller["relationship"] != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owners can remove members",
        )

    target = next((m for m in members if m["id"] == user_id), None)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in workspace",
        )

    # Prevent removing the last owner
    if target["relationship"] == "owner":
        owners = [m for m in members if m["relationship"] == "owner"]
        if len(owners) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last owner of a workspace",
            )

    remove_workspace_member(workspace_id=internal_workspace_id, user_id=user_id)
    logging.info(
        f"User {user.username} removed member ID {user_id} from workspace '{external_workspace_id}'"
    )
    return {"message": f"Member removed from workspace '{external_workspace_id}'"}


@router.post("/{external_workspace_id}/tokens")
def create_token(
    external_workspace_id: str,
    payload: CreateWorkspaceTokenRequest,
    user: InternalUser = Depends(get_current_user),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
):
    """Create a new token for a workspace (admin/owner only)."""

    description = payload.description.strip()
    token = create_workspace_token(
        internal_workspace_id,
        user.id,
        description=description,
    )

    return {
        "token": token.token,
        "warning": "This token will only be displayed once. Please save it securely.",
    }


@router.get("/{external_workspace_id}/tokens")
def get_tokens(
    user: InternalUser = Depends(get_current_user),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
):
    """Get all tokens for a workspace (admin/owner only)."""
    tokens = get_workspace_tokens(internal_workspace_id)
    logging.info(
        f"User {user.username} fetched tokens for workspace ID {internal_workspace_id}. Token count: {len(tokens)}"
    )

    return {
        "data": tokens,
    }


@router.delete("/{external_workspace_id}/tokens/{token_id}")
def revoke_token(
    token_id: int,
    user: InternalUser = Depends(get_current_user),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
):
    """Revoke a token for a workspace (admin/owner only)."""
    revoke_workspace_token(
        workspace_id=internal_workspace_id, token_id=token_id, revoked_by=user.id
    )
    logging.info(
        f"User {user.username} revoked token ID {token_id} for workspace ID {internal_workspace_id}"
    )
    return {"message": f"Token {token_id} revoked successfully."}


@router.delete("/{external_workspace_id}")
def delete_workspace_route(
    external_workspace_id: str,
    user: InternalUser = Depends(get_current_user),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
):
    """Delete a workspace entirely. Only owners may do this."""
    members = get_workspace_members(internal_workspace_id)
    caller = next((m for m in members if m["id"] == user.id), None)
    if not caller or caller["relationship"] != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only workspace owners can delete a workspace",
        )

    delete_workspace(
        workspace_id=internal_workspace_id, external_id=external_workspace_id
    )
    logging.info(f"User {user.username} deleted workspace '{external_workspace_id}'")
    return {"message": f"Workspace '{external_workspace_id}' deleted successfully"}
