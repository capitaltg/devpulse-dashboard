import logging

from fastapi import APIRouter, Depends, Query

from app.models import InternalUser
from app.schemas.stats import (
    ActivityFeedResponse,
    CommitAdditionsDeletionsResponse,
    CommitsByDateResponse,
    ContributionsByDateResponse,
    LanguageDistributionResponse,
    MemberActivityResponse,
    OrgOverviewStatsResponse,
    PRCycleTimeResponse,
    RepositoryActivityResponse,
    StatsByAuthorResponse,
    WeeklyActivityResponse,
)
from app.utils import get_authorized_workspace_id, get_current_user
from app.utils.stats import (
    query_commit_additions_deletions,
    query_commits_by_date,
    query_contributions_by_date,
    query_language_distribution,
    query_member_activity,
    query_org_overview_stats,
    query_pr_cycle_time,
    query_recent_activity,
    query_repository_activity,
    query_stats_by_author,
    query_weekly_activity,
)

router = APIRouter(prefix="/v1/{external_workspace_id}/stats", tags=["stats"])


@router.get(
    "/overview",
    response_model=OrgOverviewStatsResponse,
)
def get_org_overview_stats(
    organization: str = None,
    days: int = Query(90, ge=1, le=365),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    data = query_org_overview_stats(
        workspace_id=internal_workspace_id,
        organization=organization,
        days=days,
    )
    logging.info(
        f"User {user.username} fetched org overview stats for organization '{organization}' "
        f"in workspace ID {internal_workspace_id} over last {days} days."
    )
    return {"data": data}


@router.get(
    "/weekly-activity",
    response_model=WeeklyActivityResponse,
)
def get_weekly_activity(
    organization: str = None,
    weeks: int = Query(12, ge=1, le=52),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    data = query_weekly_activity(
        workspace_id=internal_workspace_id,
        organization=organization,
        weeks=weeks,
    )
    logging.info(
        f"User {user.username} fetched weekly activity for organization '{organization}' "
        f"in workspace {internal_workspace_id} over last {weeks} weeks. Weeks returned: {len(data)}"
    )
    return {"data": data}


@router.get(
    "/language-distribution",
    response_model=LanguageDistributionResponse,
)
def get_language_distribution(
    organization: str = None,
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    data = query_language_distribution(
        workspace_id=internal_workspace_id,
        organization=organization,
    )
    logging.info(
        f"User {user.username} fetched language distribution for organization '{organization}' "
        f"in workspace {internal_workspace_id}. Languages returned: {len(data)}"
    )
    return {"data": data}


@router.get(
    "/recent-activity",
    response_model=ActivityFeedResponse,
)
def get_recent_activity(
    organization: str = None,
    repository: str = None,
    user: str = None,
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(20, ge=1, le=100),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    current_user: InternalUser = Depends(get_current_user),
):
    data = query_recent_activity(
        workspace_id=internal_workspace_id,
        organization=organization,
        repository=repository,
        user=user,
        days=days,
        limit=limit,
    )
    logging.info(
        f"User {current_user.username} fetched recent activity for org='{organization}' "
        f"repo='{repository}' user='{user}' in workspace {internal_workspace_id}. "
        f"Events returned: {len(data)}"
    )
    return {"data": data}


@router.get(
    "/commits-by-date",
    response_model=CommitsByDateResponse,
)
def get_commits_by_date(
    author: str = None,
    organization: str = None,
    repository: str = None,
    days: int = Query(365, ge=1),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    data = query_commits_by_date(
        workspace_id=internal_workspace_id,
        organization=organization,
        author=author,
        repository=repository,
        days=days,
    )
    logging.info(
        f"User {user.username} fetched commits by date for author '{author}' in organization '{organization}' for workspace ID {internal_workspace_id} over last {days} days. Data points returned: {len(data)}"
    )
    return {
        "data": data,
    }


@router.get(
    "/repository-activity",
    response_model=RepositoryActivityResponse,
)
def get_repository_activity(
    organization: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    data = query_repository_activity(
        workspace_id=internal_workspace_id,
        organization=organization,
        page=page,
        limit=limit,
    )
    logging.info(
        f"User {user.username} fetched repository activity for organization '{organization}' in workspace ID {internal_workspace_id}. Data points returned: {len(data)}"
    )
    return {
        "count": len(data),
        "page": page,
        "data": data,
    }


@router.get(
    "/member-activity",
    response_model=MemberActivityResponse,
)
def get_member_activity(
    organization: str = Query(..., min_length=1),
    repository: str = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    days: int = Query(90, ge=1, le=365),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    data = query_member_activity(
        workspace_id=internal_workspace_id,
        organization=organization,
        repository=repository,
        days=days,
        page=page,
        limit=limit,
    )
    logging.info(
        f"User {user.username} fetched member activity for organization '{organization}' in workspace ID {internal_workspace_id}. Data points returned: {len(data)}"
    )
    return {
        "count": len(data),
        "page": page,
        "data": data,
    }


@router.get(
    "/stats-by-author",
    response_model=StatsByAuthorResponse,
)
def get_stats_by_author(
    organization: str = Query(..., min_length=1),
    repository: str = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    days: int = Query(90, ge=1, le=365),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    data = query_stats_by_author(
        workspace_id=internal_workspace_id,
        organization=organization,
        repository=repository,
        days=days,
        page=page,
        limit=limit,
    )
    logging.info(
        f"User {user.username} fetched stats by author for organization '{organization}' in workspace ID {internal_workspace_id}. Data points returned: {len(data)}"
    )
    return {
        "count": len(data),
        "page": page,
        "data": data,
    }


@router.get(
    "/commit-additions-deletions",
    response_model=CommitAdditionsDeletionsResponse,
)
def get_commit_additions_deletions(
    organization: str = Query(..., min_length=1),
    repository: str = None,
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    data = query_commit_additions_deletions(
        workspace_id=internal_workspace_id,
        organization=organization,
        repository=repository,
    )
    logging.info(
        f"User {user.username} fetched commit additions/deletions stats for organization '{organization}' in workspace ID {internal_workspace_id}. Data points returned: {len(data)}"
    )
    return {
        "count": len(data),
        "data": data,
    }


@router.get(
    "/pr-cycle-time",
    response_model=PRCycleTimeResponse,
)
def get_pr_cycle_time(
    organization: str = None,
    repository: str = None,
    weeks: int = Query(12, ge=1, le=52),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    data = query_pr_cycle_time(
        workspace_id=internal_workspace_id,
        organization=organization,
        repository=repository,
        weeks=weeks,
    )
    logging.info(
        f"User {user.username} fetched PR cycle time for org='{organization}' "
        f"repo='{repository}' in workspace {internal_workspace_id} over last {weeks} weeks. "
        f"Data points returned: {len(data)}"
    )
    return {"data": data}


@router.get(
    "/contributions-by-date",
    response_model=ContributionsByDateResponse,
)
def get_contributions_by_date(
    organization: str = None,
    repository: str = None,
    author: str = None,
    days: int = Query(365, ge=1),
    internal_workspace_id: int = Depends(get_authorized_workspace_id),
    user: InternalUser = Depends(get_current_user),
):
    data = query_contributions_by_date(
        workspace_id=internal_workspace_id,
        organization=organization,
        repository=repository,
        author=author,
        days=days,
    )
    logging.info(
        f"User {user.username} fetched contributions by date for org='{organization}' "
        f"repo='{repository}' author='{author}' in workspace {internal_workspace_id} "
        f"over last {days} days. Data points returned: {len(data)}"
    )
    return {"data": data}
