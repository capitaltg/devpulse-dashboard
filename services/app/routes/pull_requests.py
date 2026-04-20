import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.models import InternalUser
from app.schemas.pull_request import PROverviewStatsResponse
from app.utils import (
    get_authorized_workspace_id,
    get_current_user,
    query_pull_requests,
)
from app.utils.pull_request import (
    get_pull_request_by_org_repo_number,
    query_pr_overview_stats,
)

router = APIRouter(
    prefix="/v1/{external_workspace_id}/pull-requests", tags=["pull-requests"]
)


@router.get("")
def get_pull_requests(
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    organization: Optional[str] = None,
    repository: Optional[str] = None,
    state: Optional[str] = Query(default=None, pattern="^(open|closed|merged)$"),
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    user: InternalUser = Depends(get_current_user),
):
    """
    List pull requests for a workspace.

    Query params:
      organization – filter by org login
      repository   – filter by repo name
      state        – open | closed | merged (omit for all)
      limit / page – pagination
    """
    items, total = query_pull_requests(
        workspace_id=internal_workspace_id,
        organization=organization,
        repository=repository,
        state=state,
        limit=limit,
        page=page,
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": items,
    }


@router.get("/stats", response_model=PROverviewStatsResponse)
def get_pr_overview_stats(
    organization: Optional[str] = None,
    repository: Optional[str] = None,
    author: Optional[str] = None,
    days: int = Query(90, ge=1, le=365),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    """
    Aggregate PR health stats for a workspace.

    Query params:
      organization – filter by org login
      repository   – filter by repo name (requires organization when ambiguous)
      author       – filter by PR author login
      days         – lookback window in days (default 90, max 365)
    """
    data = query_pr_overview_stats(
        workspace_id=internal_workspace_id,
        organization=organization,
        repository=repository,
        author=author,
        days=days,
    )
    logging.info(
        f"User {user.username} fetched PR overview stats for org='{organization}' "
        f"repo='{repository}' author='{author}' days={days} "
        f"in workspace {internal_workspace_id}."
    )
    return {"data": data}


@router.get("/{org}/{repo}/{number}")
def get_pull_request(
    org: str,
    repo: str,
    number: int,
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    """Get a single pull request by org, repo name, and PR number."""
    pr = get_pull_request_by_org_repo_number(
        workspace_id=internal_workspace_id, org=org, repo=repo, number=number
    )
    if not pr:
        raise HTTPException(status_code=404, detail="Pull request not found")
    return {"data": pr}
