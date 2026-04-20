"""
Workflow Run API routes.
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.models import InternalUser
from app.utils import get_current_user, query_workflow_run_stats, query_workflow_runs
from app.utils.workspace import get_authorized_workspace_id

router = APIRouter(
    prefix="/v1/{external_workspace_id}/workflow-runs",
    tags=["workflow-runs"],
)

logger = logging.getLogger(__name__)


@router.get("/stats")
def get_workflow_run_stats(
    organization: Optional[str] = Query(
        None, description="Filter by organization login"
    ),
    repository: Optional[str] = Query(None, description="Filter by repository name"),
    user: InternalUser = Depends(get_current_user),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
):
    """
    Returns aggregate workflow run counts by UI status bucket
    (success, failure, in_progress, cancelled) plus a success_rate percentage.
    """
    stats = query_workflow_run_stats(
        workspace_id=internal_workspace_id,
        organization=organization,
        repository=repository,
    )
    return {"data": stats}


@router.get("")
def get_workflow_runs(
    organization: Optional[str] = Query(
        None, description="Filter by organization login"
    ),
    repository: Optional[str] = Query(None, description="Filter by repository name"),
    status: Optional[str] = Query(
        None,
        description="UI status filter: success | failure | in_progress | cancelled",
    ),
    branch: Optional[str] = Query(None, description="Filter by head branch"),
    event: Optional[str] = Query(
        None, description="Filter by trigger event (push, pull_request, …)"
    ),
    search: Optional[str] = Query(
        None, description="Search workflow name, repo, or branch"
    ),
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    user: InternalUser = Depends(get_current_user),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
):
    """
    Returns a paginated list of workflow runs for the workspace.
    Use the `status` param for UI-friendly filtering (maps status+conclusion internally).
    """
    runs, total = query_workflow_runs(
        workspace_id=internal_workspace_id,
        organization=organization,
        repository=repository,
        status=status,
        branch=branch,
        event=event,
        search=search,
        limit=limit,
        page=page,
    )
    logger.info(
        "User %s fetched workflow runs for workspace %s (org=%s, status=%s, page=%s)",
        user.username,
        internal_workspace_id,
        organization,
        status,
        page,
    )
    return {"total": total, "page": page, "limit": limit, "data": runs}
