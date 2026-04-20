"""
User API routes.
Handles user-related endpoints that are not workspace-specific.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query

from app.models import InternalUser
from app.schemas.stats import UserActivityStatsResponse, UserLinesByRepoResponse
from app.utils import get_current_user, get_external_user_by_login, upsert_external_user
from app.utils.github_utils import fetch_github_user
from app.utils.stats import query_user_activity_stats, query_user_lines_by_repo
from app.utils.workspace import get_authorized_workspace_id

router = APIRouter(prefix="/v1", tags=["user"])
workspace_router = APIRouter(prefix="/v1/{external_workspace_id}", tags=["user"])


@router.get("/me")
def get_me(
    user: InternalUser = Depends(get_current_user),
):
    """Get current authenticated user information"""
    logging.info(f"User reviewed profile: {user}")

    return {
        "data": user,
    }


@workspace_router.get("/members/{login}")
def get_member(
    login: str,
    user: InternalUser = Depends(get_current_user),
):
    """
    Get a user's profile by GitHub login.

    Checks the local `users` table first. If the user is not found locally,
    falls back to the GitHub public API (`/users/{login}`) and upserts the
    result before returning it. Returns 404 if the user doesn't exist anywhere.
    """
    member = get_external_user_by_login(login)
    if member is None:
        github_data = fetch_github_user(login)
        if github_data:
            member = upsert_external_user(github_data)

    if member is None:
        raise HTTPException(status_code=404, detail=f"User '{login}' not found")

    return {"data": member}


@workspace_router.get(
    "/members/{login}/stats",
    response_model=UserActivityStatsResponse,
)
def get_member_stats(
    login: str,
    organization: str = Query(None, description="Filter by organization login"),
    days: int = Query(90, ge=1, le=365),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    """
    Returns activity stats for a contributor over the last `days` days:
    commits, PRs opened/merged, lines added/removed, repos contributed.
    """
    data = query_user_activity_stats(
        workspace_id=internal_workspace_id,
        login=login,
        organization=organization,
        days=days,
    )
    logging.info(
        f"User {user.username} fetched stats for member '{login}' "
        f"in workspace {internal_workspace_id} over last {days} days."
    )
    return {"data": data}


@workspace_router.get(
    "/members/{login}/lines-by-repo",
    response_model=UserLinesByRepoResponse,
)
def get_member_lines_by_repo(
    login: str,
    organization: str = Query(None, description="Filter by organization login"),
    days: int = Query(90, ge=1, le=365),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    """
    Returns per-repository line addition/deletion breakdown for a contributor
    over the last `days` days, sorted by additions descending.
    """
    data = query_user_lines_by_repo(
        workspace_id=internal_workspace_id,
        login=login,
        organization=organization,
        days=days,
    )
    return {"data": data}
