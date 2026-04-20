from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class CommitByDatePoint(BaseModel):
    date: date
    day_of_week_number: float
    commit_count: int


class CommitsByDateResponse(BaseModel):
    data: list[CommitByDatePoint]


class RepositoryActivityPoint(BaseModel):
    name: str
    pull_request_count: int
    owner: str
    language: Optional[str] = None
    description: Optional[str] = None
    latest_pr_date: Optional[datetime] = None


class RepositoryActivityResponse(BaseModel):
    count: int
    page: int
    data: list[RepositoryActivityPoint]


class MemberActivityPoint(BaseModel):
    author: str
    author_id: Optional[int] = None
    organization: str
    total_prs: int
    open_prs: int
    closed_unmerged_prs: int
    merged_prs: int
    draft_prs: int
    repositories_contributed_to: int
    total_additions: int
    total_deletions: int
    total_files_changed: int
    avg_lines_changed: float
    avg_comments_per_pr: float
    first_pr_date: Optional[datetime] = None
    latest_pr_date: Optional[datetime] = None
    avg_hours_to_merge: Optional[float] = None
    avg_hours_to_close: Optional[float] = None


class MemberActivityResponse(BaseModel):
    count: int
    page: int
    data: list[MemberActivityPoint]


class StatsByAuthorPoint(BaseModel):
    author: str
    total_commits: int
    total_prs: int
    repositories_count: int
    total_additions: int
    total_deletions: int
    total_changes: int
    avg_changes_per_commit: float
    first_commit_date: Optional[datetime] = None
    last_commit_date: Optional[datetime] = None
    merge_commits: int
    standard_commits: int


class StatsByAuthorResponse(BaseModel):
    count: int
    page: int
    data: list[StatsByAuthorPoint]


class CommitAdditionsDeletionsPoint(BaseModel):
    date: date
    day_of_week_number: float
    commit_count: int
    total_additions: int
    total_deletions: int
    total_changes: int
    avg_additions_per_commit: float
    avg_deletions_per_commit: float
    avg_changes_per_commit: float
    unique_authors: int


class CommitAdditionsDeletionsResponse(BaseModel):
    count: int
    data: list[CommitAdditionsDeletionsPoint]


class OrgOverviewStats(BaseModel):
    days: int
    active_repos: int
    contributors: int
    commits: int
    prs_opened: int
    prs_merged: int
    issues_opened: int
    workflow_runs: int
    workflow_success_rate: float


class OrgOverviewStatsResponse(BaseModel):
    data: OrgOverviewStats


class UserActivityStats(BaseModel):
    login: str
    days: int
    commits: int
    prs_opened: int
    prs_merged: int
    total_additions: int
    total_deletions: int
    repos_contributed: int
    avg_hours_to_merge: Optional[float] = None


class UserActivityStatsResponse(BaseModel):
    data: UserActivityStats


class WeeklyActivityPoint(BaseModel):
    week: str  # ISO week start date, e.g. "2025-01-06"
    commits: int
    prs_opened: int
    prs_merged: int
    workflow_runs: int


class WeeklyActivityResponse(BaseModel):
    data: list[WeeklyActivityPoint]


class LanguageDistributionPoint(BaseModel):
    language: str
    count: int
    percentage: float
    color: str


class LanguageDistributionResponse(BaseModel):
    data: list[LanguageDistributionPoint]


class ActivityEventItem(BaseModel):
    id: str
    type: str  # push | pr_opened | pr_merged | issue_opened | issue_closed | release
    actor: str
    repo: str  # short repo name
    repo_full_name: str
    message: str
    title: Optional[str] = None
    timestamp: datetime


class ActivityFeedResponse(BaseModel):
    data: list[ActivityEventItem]


class PRCycleTimePoint(BaseModel):
    week: str  # ISO week start date, e.g. "2025-01-06"
    avg_hours: float
    median_hours: float


class PRCycleTimeResponse(BaseModel):
    data: list[PRCycleTimePoint]


class ContributionsByDatePoint(BaseModel):
    date: date
    commits: int
    prs_merged: int
    issues_opened: int
    pr_reviews: int  # PR review submissions + inline review comments combined
    issue_comments: int


class ContributionsByDateResponse(BaseModel):
    data: list[ContributionsByDatePoint]


class UserLinesByRepoPoint(BaseModel):
    repo_full_name: str
    additions: int
    deletions: int
    commits: int


class UserLinesByRepoResponse(BaseModel):
    data: list[UserLinesByRepoPoint]
