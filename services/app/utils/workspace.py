import secrets
from datetime import datetime
from typing import Optional

from cachetools import TTLCache
from fastapi import Depends, HTTPException, status
from sqlmodel import select

from app.db import get_session
from app.models import InternalUser, Workspace, WorkspaceMember
from app.models.workspace import WorkspaceToken

workspace_id_cache = TTLCache(maxsize=1000, ttl=300)
membership_cache = TTLCache(maxsize=2000, ttl=60)

# Imported here (not at top) to avoid circular imports if auth ever imports from workspace
from app.utils.auth import get_current_user as _get_current_user


def get_workspace_id_by_external_id(external_workspace_id: str) -> Optional[int]:
    """
    Retrieve workspace id by external id, using cache for faster repeated lookups.

    Args:
        external_workspace_id: Workspace external id

    Returns:
        Workspace id if found, otherwise None.
    """
    cache_key = external_workspace_id
    if cache_key in workspace_id_cache:
        return workspace_id_cache[cache_key]

    with get_session() as session:
        workspace_id = session.exec(
            select(Workspace.id).where(Workspace.external_id == cache_key)
        ).first()

    workspace_id_cache[cache_key] = workspace_id
    return workspace_id


def _check_workspace_membership(workspace_id: int, user_id: int) -> None:
    """Verify user is a member of the workspace, raising 403 if not."""
    cache_key = (workspace_id, user_id)
    if cache_key in membership_cache:
        return

    with get_session() as session:
        membership = session.exec(
            select(WorkspaceMember.workspace_id)
            .where(WorkspaceMember.workspace_id == workspace_id)
            .where(WorkspaceMember.user_id == user_id)
        ).first()

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this workspace",
        )

    membership_cache[cache_key] = True


async def get_authorized_workspace_id(
    internal_workspace_id: int = Depends(get_workspace_id_by_external_id),
    current_user: InternalUser = Depends(_get_current_user),
) -> int:
    """
    Dependency that resolves the workspace ID and verifies the current user
    is a member of that workspace. Use this instead of get_workspace_id_by_external_id
    in route handlers.

    Raises:
        HTTPException 404: If workspace not found
        HTTPException 403: If user is not a member of the workspace
    """
    if internal_workspace_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )
    _check_workspace_membership(internal_workspace_id, current_user.id)
    return internal_workspace_id


def get_user_workspaces(user_id: int) -> list[dict[str, object]]:
    """
    Retrieve all workspaces a user is a member of.

    Args:
        user_id: ID of the user

    Returns:
        List of workspaces with membership relationship metadata.
    """
    with get_session() as session:
        rows = session.exec(
            select(Workspace, WorkspaceMember.relationship)
            .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
            .where(WorkspaceMember.user_id == user_id)
        ).all()
        return [
            {
                **workspace.model_dump(),
                "relationship": relationship,
            }
            for workspace, relationship in rows
        ]


def create_workspace(description: str, creator_id: int) -> Workspace:
    """
    Create a workspace and add the creator as an owner.

    Args:
        description: Workspace description provided by the user
        creator_id: ID of the user creating the workspace

    Returns:
        Newly created Workspace
    """
    external_id = description.lower().replace(" ", "-")
    now = datetime.utcnow()

    with get_session() as session:
        workspace = Workspace(
            external_id=external_id,
            description=description,
            creator_id=creator_id,
            created_at=now,
            updated_at=now,
        )
        session.add(workspace)
        session.commit()
        session.refresh(workspace)

        membership = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=creator_id,
            relationship="owner",
            added_at=now,
            updated_at=now,
        )
        session.add(membership)
        session.commit()

        workspace_id_cache[workspace.external_id] = workspace.id

        return workspace


def get_workspace_by_external_id(external_id: str) -> Optional[Workspace]:
    """
    Retrieve workspace details by external ID.

    Args:
        external_id: External ID of the workspace

    Returns:
        Workspace object if found, otherwise None.
    """
    with get_session() as session:
        workspace = session.exec(
            select(Workspace).where(Workspace.external_id == external_id)
        ).first()
        return workspace


def get_workspace_members(workspace_id: int) -> list[dict[str, object]]:
    """
    Retrieve all members of a workspace.

    Args:
        workspace_id: ID of the workspace

    Returns:
        List of member profiles with their workspace relationship.
    """
    with get_session() as session:
        rows = session.exec(
            select(InternalUser, WorkspaceMember.relationship)
            .join(WorkspaceMember, InternalUser.id == WorkspaceMember.user_id)
            .where(WorkspaceMember.workspace_id == workspace_id)
        ).all()
        return [
            {
                "id": user.id,
                "login": user.username,
                "name": user.display_name,
                "email": user.email,
                "is_active": user.is_active,
                "is_admin": user.is_admin,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
                "last_login_at": user.last_login_at,
                "relationship": relationship,
            }
            for user, relationship in rows
        ]


def get_workspace_tokens(workspace_id: int) -> list[dict[str, object]]:
    """
    Retrieve all tokens associated with a workspace.

    Args:
        workspace_id: ID of the workspace

    Returns:
        List of token metadata objects associated with the workspace.
    """
    with get_session() as session:
        tokens = session.exec(
            select(WorkspaceToken)
            .where(WorkspaceToken.workspace_id == workspace_id)
            .where(WorkspaceToken.is_active == True)
        ).all()
        return [token.model_dump(exclude={"token"}) for token in tokens]


def generate_token() -> str:
    """
    Generate a random 12-character token using lowercase letters and digits.

    Returns:
        A 12-character token string
    """
    alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"
    return "".join(secrets.choice(alphabet) for _ in range(12))


def create_workspace_token(
    workspace_id: int, created_by: int, description: str
) -> WorkspaceToken:
    """
    Create a new token for a workspace.

    Args:
        workspace_id: ID of the workspace
        created_by: ID of the user creating the token
        description: Description for the token

    Returns:
        Newly created WorkspaceToken
    """
    secret = generate_token()
    now = datetime.utcnow()

    with get_session() as session:
        token = WorkspaceToken(
            workspace_id=workspace_id,
            token=secret,
            description=description,
            created_at=now,
            created_by=created_by,
            is_active=True,
        )
        session.add(token)
        session.commit()
        session.refresh(token)

        return token


def get_user_by_username(username: str) -> Optional[InternalUser]:
    """Look up a user by their username."""
    with get_session() as session:
        user = session.exec(
            select(InternalUser).where(InternalUser.username == username)
        ).first()
        return user


def add_workspace_member(
    workspace_id: int, user_id: int, relationship: str
) -> WorkspaceMember:
    """Add a member to a workspace with a specified relationship."""
    now = datetime.utcnow()

    with get_session() as session:
        membership = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=user_id,
            relationship=relationship,
            added_at=now,
            updated_at=now,
        )
        session.add(membership)
        session.commit()
        session.refresh(membership)

        return membership


def remove_workspace_member(workspace_id: int, user_id: int) -> bool:
    """Remove a member from a workspace. Returns False if the membership was not found."""
    with get_session() as session:
        membership = session.exec(
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id)
            .where(WorkspaceMember.user_id == user_id)
        ).first()
        if not membership:
            return False
        session.delete(membership)
        session.commit()
        return True


def revoke_workspace_token(workspace_id: int, token_id: int, revoked_by: int) -> bool:
    """Revoke a workspace token by marking it as inactive and setting revoked metadata."""
    now = datetime.utcnow()

    with get_session() as session:
        token = session.exec(
            select(WorkspaceToken)
            .where(WorkspaceToken.id == token_id)
            .where(WorkspaceToken.workspace_id == workspace_id)
        ).first()

        if not token or not token.is_active:
            return False

        token.is_active = False
        token.revoked_at = now
        token.revoked_by = revoked_by
        session.add(token)
        session.commit()
        return True


def get_workspace_secrets(workspace_id: int) -> list[str]:
    """Retrieve all active secrets for a workspace."""
    with get_session() as session:
        return list(
            session.exec(
                select(WorkspaceToken.token)
                .where(WorkspaceToken.workspace_id == workspace_id)
                .where(WorkspaceToken.is_active == True)
                .order_by(WorkspaceToken.created_at.desc())
            ).all()
        )


def delete_workspace(workspace_id: int, external_id: str) -> None:
    """
    Delete a workspace and all its associated data (tokens, memberships).

    Args:
        workspace_id: Internal ID of the workspace
        external_id: External ID used to evict the cache entry
    """
    with get_session() as session:
        for token in session.exec(
            select(WorkspaceToken).where(WorkspaceToken.workspace_id == workspace_id)
        ).all():
            session.delete(token)

        for membership in session.exec(
            select(WorkspaceMember).where(WorkspaceMember.workspace_id == workspace_id)
        ).all():
            session.delete(membership)

        workspace = session.exec(
            select(Workspace).where(Workspace.id == workspace_id)
        ).first()
        if workspace:
            session.delete(workspace)

        session.commit()

    workspace_id_cache.pop(external_id, None)
