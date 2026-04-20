from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import case
from sqlmodel import func, select

from app.db import get_session
from app.models.pull_request import PullRequest
from app.schemas.pull_request import PROverviewStats
from app.utils.risk_score import compute_risk_score


def _pr_status(pr: PullRequest) -> str:
    if pr.merged:
        return "merged"
    if pr.state == "closed":
        return "closed"
    return "open"


def query_pull_requests(
    workspace_id: int,
    organization: Optional[str] = None,
    repository: Optional[str] = None,
    state: Optional[str] = None,
    limit: int = 20,
    page: int = 1,
) -> tuple[list[dict], int]:
    """
    Returns (items, total_count) of pull requests for the given workspace.

    Filters:
      organization – owner login (matches owner part of repository_full_name)
      repository   – repo name (matches name part of repository_full_name)
      state        – 'open' | 'closed' | 'merged' (default: all)
    """
    with get_session() as session:
        statement = select(PullRequest).where(PullRequest.workspace_id == workspace_id)

        if organization:
            statement = statement.where(
                PullRequest.repository_full_name.like(f"{organization}/%")
            )

        if repository:
            statement = statement.where(
                PullRequest.repository_full_name.like(f"%/{repository}")
            )

        if state == "merged":
            statement = statement.where(PullRequest.merged == True)
        elif state == "open":
            statement = statement.where(PullRequest.state == "open")
        elif state == "closed":
            statement = statement.where(PullRequest.state == "closed").where(
                PullRequest.merged == False
            )

        total = session.exec(statement).all()
        total_count = len(total)

        statement = (
            statement.order_by(PullRequest.updated_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )

        prs = session.exec(statement).all()

        return [
            {
                "id": pr.id,
                "number": pr.number,
                "title": pr.title,
                "status": _pr_status(pr),
                "state": pr.state,
                "draft": pr.draft,
                "repo": pr.repository_full_name,
                "author": pr.author,
                "created_at": pr.created_at,
                "updated_at": pr.updated_at,
                "closed_at": pr.closed_at,
                "merged_at": pr.merged_at,
                "merged_by": pr.merged_by,
                "labels": pr.labels or [],
                "comments": pr.comments or 0,
                "review_comments": pr.review_comments or 0,
                "commits": pr.commits or 0,
                "additions": pr.additions or 0,
                "deletions": pr.deletions or 0,
                "changed_files": pr.changed_files or 0,
                "head_ref": pr.head_ref,
                "base_ref": pr.base_ref,
                **compute_risk_score(
                    additions=pr.additions or 0,
                    deletions=pr.deletions or 0,
                    commits=pr.commits or 0,
                    changed_files=pr.changed_files or 0,
                    review_comments=pr.review_comments or 0,
                    comments=pr.comments or 0,
                    body=pr.body,
                ),
            }
            for pr in prs
        ], total_count


def _pr_to_dict(pr: PullRequest) -> dict:
    return {
        "id": pr.id,
        "number": pr.number,
        "title": pr.title,
        "body": pr.body,
        "status": _pr_status(pr),
        "state": pr.state,
        "draft": pr.draft,
        "repo": pr.repository_full_name,
        "author": pr.author,
        "created_at": pr.created_at,
        "updated_at": pr.updated_at,
        "closed_at": pr.closed_at,
        "merged_at": pr.merged_at,
        "merged_by": pr.merged_by,
        "labels": pr.labels or [],
        "assignees": pr.assignees or [],
        "requested_reviewers": pr.requested_reviewers or [],
        "comments": pr.comments or 0,
        "review_comments": pr.review_comments or 0,
        "commits": pr.commits or 0,
        "additions": pr.additions or 0,
        "deletions": pr.deletions or 0,
        "changed_files": pr.changed_files or 0,
        "head_ref": pr.head_ref,
        "base_ref": pr.base_ref,
        **compute_risk_score(
            additions=pr.additions or 0,
            deletions=pr.deletions or 0,
            commits=pr.commits or 0,
            changed_files=pr.changed_files or 0,
            review_comments=pr.review_comments or 0,
            comments=pr.comments or 0,
            body=pr.body,
        ),
    }


def get_pull_request_by_org_repo_number(
    workspace_id: int, org: str, repo: str, number: int
) -> Optional[dict]:
    with get_session() as session:
        pr = session.exec(
            select(PullRequest)
            .where(PullRequest.workspace_id == workspace_id)
            .where(PullRequest.repository_full_name == f"{org}/{repo}")
            .where(PullRequest.number == number)
        ).first()
        return _pr_to_dict(pr) if pr else None


def query_pr_overview_stats(
    workspace_id: int,
    organization: Optional[str] = None,
    repository: Optional[str] = None,
    author: Optional[str] = None,
    days: int = 90,
) -> PROverviewStats:
    """
    Returns aggregate PR health stats for the given filters:
      - counts by status (open / merged / closed-not-merged / draft)
      - merge rate and abandon rate
      - average and median cycle times (time-to-merge and time-to-close)
      - average PR size (files, commits, additions, deletions)
      - average review engagement (comments, review comments)
    """
    since = datetime.utcnow() - timedelta(days=days)

    merge_hours_expr = case(
        (
            (func.coalesce(PullRequest.merged, False) == True)
            & PullRequest.merged_at.is_not(None)
            & PullRequest.created_at.is_not(None),
            func.extract("epoch", PullRequest.merged_at - PullRequest.created_at)
            / 3600.0,
        ),
        else_=None,
    )

    close_hours_expr = case(
        (
            PullRequest.closed_at.is_not(None) & PullRequest.created_at.is_not(None),
            func.extract("epoch", PullRequest.closed_at - PullRequest.created_at)
            / 3600.0,
        ),
        else_=None,
    )

    statement = (
        select(
            func.count(PullRequest.id).label("total_prs"),
            func.sum(case((PullRequest.state == "open", 1), else_=0)).label("open_prs"),
            func.sum(
                case((func.coalesce(PullRequest.merged, False) == True, 1), else_=0)
            ).label("merged_prs"),
            func.sum(
                case(
                    (
                        (PullRequest.state == "closed")
                        & (func.coalesce(PullRequest.merged, False) == False),
                        1,
                    ),
                    else_=0,
                )
            ).label("closed_prs"),
            func.sum(
                case((func.coalesce(PullRequest.draft, False) == True, 1), else_=0)
            ).label("draft_prs"),
            func.avg(merge_hours_expr).label("avg_time_to_merge_hours"),
            func.avg(close_hours_expr).label("avg_time_to_close_hours"),
            func.percentile_cont(0.5)
            .within_group(merge_hours_expr.asc())
            .label("median_time_to_merge_hours"),
            func.percentile_cont(0.5)
            .within_group(close_hours_expr.asc())
            .label("median_time_to_close_hours"),
            func.avg(func.coalesce(PullRequest.changed_files, 0)).label(
                "avg_files_changed"
            ),
            func.avg(func.coalesce(PullRequest.commits, 0)).label("avg_commits"),
            func.avg(func.coalesce(PullRequest.additions, 0)).label("avg_additions"),
            func.avg(func.coalesce(PullRequest.deletions, 0)).label("avg_deletions"),
            func.avg(
                func.coalesce(PullRequest.comments, 0)
                + func.coalesce(PullRequest.review_comments, 0)
            ).label("avg_comments"),
            func.avg(func.coalesce(PullRequest.review_comments, 0)).label(
                "avg_review_comments"
            ),
        )
        .where(PullRequest.workspace_id == workspace_id)
        .where(PullRequest.created_at >= since)
    )

    if organization:
        statement = statement.where(
            PullRequest.repository_full_name.like(f"{organization}/%")
        )

    if repository:
        if organization:
            statement = statement.where(
                PullRequest.repository_full_name == f"{organization}/{repository}"
            )
        else:
            statement = statement.where(
                PullRequest.repository_full_name.like(f"%/{repository}")
            )

    if author:
        statement = statement.where(PullRequest.author == author)

    with get_session() as session:
        row = session.exec(statement).one()

    total = row.total_prs or 0
    merged = int(row.merged_prs or 0)
    closed = int(row.closed_prs or 0)
    decided = merged + closed  # PRs that reached a terminal state

    merge_rate = round((merged / decided) * 100, 1) if decided > 0 else 0.0
    abandon_rate = round((closed / decided) * 100, 1) if decided > 0 else 0.0

    def _round_opt(v) -> Optional[float]:
        return round(float(v), 2) if v is not None else None

    return PROverviewStats(
        total_prs=total,
        open_prs=int(row.open_prs or 0),
        merged_prs=merged,
        closed_prs=closed,
        draft_prs=int(row.draft_prs or 0),
        merge_rate=merge_rate,
        abandon_rate=abandon_rate,
        avg_time_to_merge_hours=_round_opt(row.avg_time_to_merge_hours),
        median_time_to_merge_hours=_round_opt(row.median_time_to_merge_hours),
        avg_time_to_close_hours=_round_opt(row.avg_time_to_close_hours),
        median_time_to_close_hours=_round_opt(row.median_time_to_close_hours),
        avg_files_changed=round(float(row.avg_files_changed or 0), 1),
        avg_commits=round(float(row.avg_commits or 0), 1),
        avg_additions=round(float(row.avg_additions or 0), 1),
        avg_deletions=round(float(row.avg_deletions or 0), 1),
        avg_comments=round(float(row.avg_comments or 0), 1),
        avg_review_comments=round(float(row.avg_review_comments or 0), 1),
    )
