from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.models import InternalUser
from app.utils import (
    get_authorized_workspace_id,
    get_current_user,
    query_repositories,
)

router = APIRouter(
    prefix="/v1/{external_workspace_id}/repositories", tags=["repositories"]
)


@router.get("")
def get_repositories(
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    organization: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    user: InternalUser = Depends(get_current_user),
):
    """Get repositories in the selected workspace"""
    print(
        f"Fetching repositories for workspace ID: {internal_workspace_id} and user: {user.username}"
    )

    repositories = query_repositories(
        workspace_id=internal_workspace_id,
        organization=organization,
        limit=limit,
        page=page,
    )

    return {
        "count": len(repositories),
        "data": repositories,
    }


@router.get("/{organization}/{repo}")
def get_repository_details(
    organization: str,
    repo: str,
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    """Get details for a specific repository in the selected workspace"""
    print(
        f"Fetching repository details for {organization}/{repo} in workspace ID: {internal_workspace_id} and user: {user.username}"
    )

    repositories = query_repositories(
        workspace_id=internal_workspace_id,
        organization=organization,
        name=repo,
        limit=1,
        page=1,
    )

    if not repositories:
        raise HTTPException(status_code=404, detail="Repository not found")

    return {
        "data": repositories[0],
    }
