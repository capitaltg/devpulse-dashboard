from typing import Optional

from pydantic import BaseModel


class PROverviewStats(BaseModel):
    # Counts
    total_prs: int
    open_prs: int
    merged_prs: int
    closed_prs: int  # closed but NOT merged (abandoned)
    draft_prs: int

    # Rates (percentage, 0–100)
    merge_rate: float
    abandon_rate: float

    # Cycle time for merged PRs (created_at → merged_at)
    avg_time_to_merge_hours: Optional[float]
    median_time_to_merge_hours: Optional[float]

    # Cycle time for all closed PRs (created_at → closed_at)
    avg_time_to_close_hours: Optional[float]
    median_time_to_close_hours: Optional[float]

    # PR size / complexity averages
    avg_files_changed: float
    avg_commits: float
    avg_additions: float
    avg_deletions: float

    # Review engagement
    avg_comments: float  # issue comments + review comments combined
    avg_review_comments: float  # inline code review comments only


class PROverviewStatsResponse(BaseModel):
    data: PROverviewStats
