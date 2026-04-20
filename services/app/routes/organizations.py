from typing import Optional

import requests as requests_lib
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.models import InternalUser
from app.utils import get_authorized_workspace_id, get_current_user
from app.utils.organization import (
    add_organization,
    create_organization_token,
    get_org_tokens,
    get_organization_by_login,
    query_organization_members,
    query_organization_teams,
    query_organizations,
    query_team_members,
    remove_organization,
    revoke_organization_token,
)

router = APIRouter(
    prefix="/v1/{external_workspace_id}/organizations", tags=["organizations"]
)


class CreateOrganizationTokenRequest(BaseModel):
    """Request model for creating/updating an organization GitHub PAT"""

    organization_id: int = Field(
        ..., description="GitHub organization ID (numeric, not login name)"
    )
    github_pat: str = Field(..., description="GitHub Personal Access Token")
    description: Optional[str] = Field(
        None, description="Optional description of the token's purpose"
    )


class AddOrganizationRequest(BaseModel):
    login: str = Field(..., description="GitHub organization handle (e.g. 'my-org')")
    api_key: str = Field(
        ..., description="GitHub Personal Access Token with org read scope"
    )
    description: Optional[str] = Field(
        None, description="Optional description for this token"
    )


@router.post("")
def add_organization_to_workspace(
    external_workspace_id: str,
    request: AddOrganizationRequest,
    user: InternalUser = Depends(get_current_user),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
):
    """Add a GitHub organization to a workspace by fetching its metadata via the provided API key."""
    try:
        org = add_organization(
            workspace_id=internal_workspace_id,
            login=request.login.strip(),
            api_key=request.api_key.strip(),
            created_by=user.id,
            description=request.description,
        )
    except requests_lib.exceptions.HTTPError as exc:
        gh_status = exc.response.status_code if exc.response is not None else 0
        if gh_status == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"GitHub organization '{request.login}' not found",
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"GitHub API returned {gh_status} for organization '{request.login}'",
        )
    return {"data": org.model_dump()}


@router.get("")
def get_organizations(
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    organizations = query_organizations(workspace_id=internal_workspace_id)

    return {
        "data": organizations,
    }


@router.get("/{organization}")
def get_organization(
    organization: str,
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    org = get_organization_by_login(
        workspace_id=internal_workspace_id, login=organization
    )
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization '{organization}' not found in this workspace",
        )
    return {"data": org}


@router.get("/{organization}/members")
def get_organization_members(
    organization: str,
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    members = query_organization_members(
        workspace_id=internal_workspace_id, organization=organization
    )

    return {
        "data": members,
    }


@router.get("/{organization}/teams")
def get_organization_teams(
    organization: str,
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    teams = query_organization_teams(
        workspace_id=internal_workspace_id,
        organization=organization,
        limit=limit,
        page=page,
    )

    return {
        "data": teams,
    }


@router.get("/{organization}/teams/{team}")
def get_organization_team(
    organization: str,
    team: str,
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    teams = query_organization_teams(
        workspace_id=internal_workspace_id,
        organization=organization,
        slug=team,
        limit=1,
        page=1,
    )

    if not teams:
        return {
            "data": None,
        }

    return {
        "data": teams[0],
    }


@router.get("/{organization}/teams/{team}/members")
def get_organization_team_members(
    organization: str,
    team: str,
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    members = query_team_members(
        workspace_id=internal_workspace_id,
        organization=organization,
        team=team,
    )

    return {
        "data": members,
    }


@router.post("/tokens")
def create_org_token(
    user: InternalUser = Depends(get_current_user),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    request: CreateOrganizationTokenRequest = None,
):
    create_organization_token(
        workspace_id=internal_workspace_id,
        organization_id=request.organization_id,
        github_pat=request.github_pat,
        created_by=user.id,
        description=request.description,
    )
    return {"message": "Organization token created successfully."}


@router.delete("/{organization}")
def delete_organization(
    organization: str,
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    """
    Remove an organization from the workspace, including all its tokens and
    membership records. Does not delete collected repository/commit/PR data.
    Only workspace owners may call this endpoint.
    """
    success = remove_organization(
        workspace_id=internal_workspace_id, login=organization
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization '{organization}' not found in this workspace",
        )
    return {"message": f"Organization '{organization}' removed from workspace"}


@router.get("/{organization}/tokens")
def get_org_tokens_route(
    organization: str,
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    tokens = get_org_tokens(workspace_id=internal_workspace_id, org_login=organization)
    return {"data": tokens}


@router.delete("/{organization}/tokens/{token_id}")
def revoke_org_token(
    organization: str,
    token_id: int,
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    success = revoke_organization_token(
        workspace_id=internal_workspace_id, token_id=token_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found or already revoked",
        )
    return {"message": f"Token {token_id} revoked successfully"}
