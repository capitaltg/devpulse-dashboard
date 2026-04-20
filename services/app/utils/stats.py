from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import case
from sqlmodel import func, select

from app.db import get_session
from app.models.commit import Commit
from app.models.issue import Issue
from app.models.issue_comment import IssueComment
from app.models.pull_request import PullRequest
from app.models.pull_request_review import PullRequestReview
from app.models.pull_request_review_comment import PullRequestReviewComment
from app.models.push import Push
from app.models.repository import Repository
from app.models.tag import Tag
from app.models.workflow_run import WorkflowRun
from app.schemas.stats import (
    ActivityEventItem,
    CommitAdditionsDeletionsPoint,
    CommitByDatePoint,
    ContributionsByDatePoint,
    LanguageDistributionPoint,
    MemberActivityPoint,
    OrgOverviewStats,
    PRCycleTimePoint,
    RepositoryActivityPoint,
    StatsByAuthorPoint,
    UserActivityStats,
    UserLinesByRepoPoint,
    WeeklyActivityPoint,
)


def query_commits_by_date(
    workspace_id: int,
    organization: Optional[str] = None,
    author: Optional[str] = None,
    repository: Optional[str] = None,
    days: int = 365,
) -> list[CommitByDatePoint]:
    since_date = datetime.utcnow() - timedelta(days=days)
    date_expr = func.date(Commit.author_date)
    day_of_week_expr = func.extract("dow", Commit.author_date)

    statement = (
        select(
            date_expr.label("date"),
            day_of_week_expr.label("day_of_week_number"),
            func.count(Commit.sha).label("commit_count"),
        )
        .join(Repository, Repository.id == Commit.repository_id)
        .where(Repository.workspace_id == workspace_id)
        .where(Commit.author_date.is_not(None))
        .where(Commit.author_date >= since_date)
        .group_by(date_expr, day_of_week_expr)
        .order_by(date_expr.desc())
    )

    if organization:
        statement = statement.where(Repository.owner == organization)

    if author:
        statement = statement.where(Commit.author_login == author)

    if repository:
        statement = statement.where(Repository.name == repository)

    with get_session() as session:
        rows = session.exec(statement).all()

    return [
        CommitByDatePoint(
            date=row.date,
            day_of_week_number=float(row.day_of_week_number),
            commit_count=row.commit_count,
        )
        for row in rows
    ]


def query_repository_activity(
    workspace_id: int,
    organization: Optional[str] = None,
    limit: int = 20,
    page: int = 1,
) -> list[RepositoryActivityPoint]:
    pr_count_expr = func.count(func.distinct(PullRequest.id))
    latest_pr_date_expr = func.max(PullRequest.created_at)

    statement = (
        select(
            Repository.name,
            pr_count_expr.label("pull_request_count"),
            Repository.owner,
            Repository.language,
            Repository.description,
            latest_pr_date_expr.label("latest_pr_date"),
        )
        .join(PullRequest, PullRequest.repository_id == Repository.id)
        .where(Repository.workspace_id == workspace_id)
        .group_by(
            Repository.id,
            Repository.name,
            Repository.owner,
            Repository.language,
            Repository.description,
        )
        .order_by(pr_count_expr.desc(), latest_pr_date_expr.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )

    if organization:
        statement = statement.where(Repository.owner == organization)

    with get_session() as session:
        rows = session.exec(statement).all()

    return [
        RepositoryActivityPoint(
            name=row.name,
            pull_request_count=row.pull_request_count,
            owner=row.owner,
            language=row.language,
            description=row.description,
            latest_pr_date=row.latest_pr_date,
        )
        for row in rows
    ]


def query_member_activity(
    workspace_id: int,
    organization: str,
    days: int,
    repository: str = None,
    limit: int = 20,
    page: int = 1,
) -> list[MemberActivityPoint]:
    since_date = datetime.utcnow() - timedelta(days=days)

    total_prs_expr = func.count(func.distinct(PullRequest.id))
    open_prs_expr = func.sum(case((PullRequest.state == "open", 1), else_=0))
    closed_unmerged_expr = func.sum(
        case(
            (
                (PullRequest.state == "closed")
                & (func.coalesce(PullRequest.merged, False) == False),
                1,
            ),
            else_=0,
        )
    )
    merged_prs_expr = func.sum(
        case((func.coalesce(PullRequest.merged, False) == True, 1), else_=0)
    )
    draft_prs_expr = func.sum(
        case((func.coalesce(PullRequest.draft, False) == True, 1), else_=0)
    )
    repos_contributed_expr = func.count(func.distinct(PullRequest.repository_id))
    total_additions_expr = func.sum(func.coalesce(PullRequest.additions, 0))
    total_deletions_expr = func.sum(func.coalesce(PullRequest.deletions, 0))
    total_files_changed_expr = func.sum(func.coalesce(PullRequest.changed_files, 0))
    avg_lines_changed_expr = func.avg(
        func.coalesce(PullRequest.additions, 0)
        + func.coalesce(PullRequest.deletions, 0)
    )
    avg_comments_expr = func.avg(func.coalesce(PullRequest.comments, 0))
    first_pr_date_expr = func.min(PullRequest.created_at)
    latest_pr_date_expr = func.max(PullRequest.created_at)
    avg_hours_to_merge_expr = func.avg(
        case(
            (
                (PullRequest.created_at.is_not(None))
                & (PullRequest.merged_at.is_not(None)),
                func.extract("epoch", PullRequest.merged_at - PullRequest.created_at)
                / 3600.0,
            ),
            else_=None,
        )
    )
    avg_hours_to_close_expr = func.avg(
        case(
            (
                (PullRequest.created_at.is_not(None))
                & (PullRequest.closed_at.is_not(None)),
                func.extract("epoch", PullRequest.closed_at - PullRequest.created_at)
                / 3600.0,
            ),
            else_=None,
        )
    )

    statement = (
        select(
            PullRequest.author,
            PullRequest.author_id,
            Repository.owner.label("organization"),
            total_prs_expr.label("total_prs"),
            open_prs_expr.label("open_prs"),
            closed_unmerged_expr.label("closed_unmerged_prs"),
            merged_prs_expr.label("merged_prs"),
            draft_prs_expr.label("draft_prs"),
            repos_contributed_expr.label("repositories_contributed_to"),
            total_additions_expr.label("total_additions"),
            total_deletions_expr.label("total_deletions"),
            total_files_changed_expr.label("total_files_changed"),
            avg_lines_changed_expr.label("avg_lines_changed"),
            avg_comments_expr.label("avg_comments_per_pr"),
            first_pr_date_expr.label("first_pr_date"),
            latest_pr_date_expr.label("latest_pr_date"),
            avg_hours_to_merge_expr.label("avg_hours_to_merge"),
            avg_hours_to_close_expr.label("avg_hours_to_close"),
        )
        .join(Repository, Repository.id == PullRequest.repository_id)
        .where(Repository.workspace_id == workspace_id)
        .where(Repository.owner == organization)
        .where(PullRequest.author.is_not(None))
        .where(PullRequest.created_at >= since_date)
        .where(Repository.name == repository if repository else True)
        .group_by(PullRequest.author, PullRequest.author_id, Repository.owner)
        .order_by(total_prs_expr.desc(), latest_pr_date_expr.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )

    with get_session() as session:
        rows = session.exec(statement).all()

    return [
        MemberActivityPoint(
            author=row.author,
            author_id=row.author_id,
            organization=row.organization,
            total_prs=row.total_prs,
            open_prs=row.open_prs,
            closed_unmerged_prs=row.closed_unmerged_prs,
            merged_prs=row.merged_prs,
            draft_prs=row.draft_prs,
            repositories_contributed_to=row.repositories_contributed_to,
            total_additions=row.total_additions,
            total_deletions=row.total_deletions,
            total_files_changed=row.total_files_changed,
            avg_lines_changed=round(float(row.avg_lines_changed or 0), 2),
            avg_comments_per_pr=round(float(row.avg_comments_per_pr or 0), 2),
            first_pr_date=row.first_pr_date,
            latest_pr_date=row.latest_pr_date,
            avg_hours_to_merge=(
                round(float(row.avg_hours_to_merge), 2)
                if row.avg_hours_to_merge is not None
                else None
            ),
            avg_hours_to_close=(
                round(float(row.avg_hours_to_close), 2)
                if row.avg_hours_to_close is not None
                else None
            ),
        )
        for row in rows
    ]


def query_stats_by_author(
    workspace_id: int,
    organization: str,
    days: int = 90,
    repository: str = None,
    limit: int = 20,
    page: int = 1,
) -> list[StatsByAuthorPoint]:
    since_date = datetime.utcnow() - timedelta(days=days)

    total_changes_expr = func.coalesce(
        Commit.total_changes,
        func.coalesce(Commit.additions, 0) + func.coalesce(Commit.deletions, 0),
        0,
    )
    total_commits_expr = func.count(func.distinct(Commit.sha))
    repositories_count_expr = func.count(func.distinct(Commit.repository_id))
    total_additions_expr = func.sum(func.coalesce(Commit.additions, 0))
    total_deletions_expr = func.sum(func.coalesce(Commit.deletions, 0))
    total_changes_sum_expr = func.sum(total_changes_expr)
    avg_changes_expr = func.avg(total_changes_expr)
    merge_commits_expr = func.sum(case((Commit.commit_type == "merge", 1), else_=0))
    standard_commits_expr = func.sum(
        case((Commit.commit_type == "standard", 1), else_=0)
    )
    first_commit_date_expr = func.min(Commit.author_date)
    last_commit_date_expr = func.max(Commit.author_date)

    pr_count_expr = (
        select(func.count(PullRequest.id))
        .where(PullRequest.workspace_id == workspace_id)
        .where(PullRequest.author == Commit.author_login)
        .where(PullRequest.repository_full_name.like(f"{organization}/%"))
        .where(PullRequest.created_at >= since_date)
        .scalar_subquery()
    )

    statement = (
        select(
            Commit.author_login.label("author"),
            total_commits_expr.label("total_commits"),
            pr_count_expr.label("total_prs"),
            repositories_count_expr.label("repositories_count"),
            total_additions_expr.label("total_additions"),
            total_deletions_expr.label("total_deletions"),
            total_changes_sum_expr.label("total_changes"),
            avg_changes_expr.label("avg_changes_per_commit"),
            first_commit_date_expr.label("first_commit_date"),
            last_commit_date_expr.label("last_commit_date"),
            merge_commits_expr.label("merge_commits"),
            standard_commits_expr.label("standard_commits"),
        )
        .join(Repository, Repository.id == Commit.repository_id)
        .where(Repository.workspace_id == workspace_id)
        .where(Repository.owner == organization)
        .where(Repository.name == repository if repository else True)
        .where(Commit.author_login.is_not(None))
        .where(Commit.author_date.is_not(None))
        .where(Commit.author_date >= since_date)
        .group_by(Commit.author_login)
        .order_by(total_commits_expr.desc(), last_commit_date_expr.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )

    with get_session() as session:
        rows = session.exec(statement).all()

    return [
        StatsByAuthorPoint(
            author=row.author,
            total_commits=row.total_commits,
            total_prs=row.total_prs or 0,
            repositories_count=row.repositories_count,
            total_additions=row.total_additions,
            total_deletions=row.total_deletions,
            total_changes=row.total_changes,
            avg_changes_per_commit=round(float(row.avg_changes_per_commit or 0), 2),
            first_commit_date=row.first_commit_date,
            last_commit_date=row.last_commit_date,
            merge_commits=row.merge_commits,
            standard_commits=row.standard_commits,
        )
        for row in rows
    ]


def query_commit_additions_deletions(
    workspace_id: int,
    organization: str,
    repository: str = None,
) -> list[CommitAdditionsDeletionsPoint]:
    date_expr = func.date(Commit.author_date)
    day_of_week_expr = func.extract("dow", Commit.author_date)
    total_changes_expr = func.coalesce(
        Commit.total_changes,
        func.coalesce(Commit.additions, 0) + func.coalesce(Commit.deletions, 0),
        0,
    )

    statement = (
        select(
            date_expr.label("date"),
            day_of_week_expr.label("day_of_week_number"),
            func.count(func.distinct(Commit.sha)).label("commit_count"),
            func.sum(func.coalesce(Commit.additions, 0)).label("total_additions"),
            func.sum(func.coalesce(Commit.deletions, 0)).label("total_deletions"),
            func.sum(total_changes_expr).label("total_changes"),
            func.avg(func.coalesce(Commit.additions, 0)).label(
                "avg_additions_per_commit"
            ),
            func.avg(func.coalesce(Commit.deletions, 0)).label(
                "avg_deletions_per_commit"
            ),
            func.avg(total_changes_expr).label("avg_changes_per_commit"),
            func.count(func.distinct(Commit.author_login)).label("unique_authors"),
        )
        .join(Repository, Repository.id == Commit.repository_id)
        .where(Repository.workspace_id == workspace_id)
        .where(Repository.owner == organization)
        .where(Repository.name == repository if repository else True)
        .where(Commit.author_date.is_not(None))
        .group_by(date_expr, day_of_week_expr)
        .order_by(date_expr.desc())
    )

    with get_session() as session:
        rows = session.exec(statement).all()

    return [
        CommitAdditionsDeletionsPoint(
            date=row.date,
            day_of_week_number=float(row.day_of_week_number),
            commit_count=row.commit_count,
            total_additions=row.total_additions,
            total_deletions=row.total_deletions,
            total_changes=row.total_changes,
            avg_additions_per_commit=round(float(row.avg_additions_per_commit or 0), 2),
            avg_deletions_per_commit=round(float(row.avg_deletions_per_commit or 0), 2),
            avg_changes_per_commit=round(float(row.avg_changes_per_commit or 0), 2),
            unique_authors=row.unique_authors,
        )
        for row in rows
    ]


def query_org_overview_stats(
    workspace_id: int,
    organization: Optional[str] = None,
    days: int = 90,
) -> OrgOverviewStats:
    """
    Returns a single summary of org activity over the last `days` days:
    - active_repos: distinct repos with at least one commit
    - contributors: distinct commit authors
    - commits: total commits
    - prs_opened: PRs created in the period
    - prs_merged: PRs merged in the period
    - issues_opened: issues (non-PR) created in the period
    - workflow_runs: workflow runs created in the period
    - workflow_success_rate: % of completed runs that succeeded
    """
    since = datetime.utcnow() - timedelta(days=days)

    with get_session() as session:
        # --- commits, active repos, contributors ---
        commit_stmt = (
            select(
                func.count(func.distinct(Commit.sha)).label("commits"),
                func.count(func.distinct(Commit.repository_id)).label("active_repos"),
                func.count(func.distinct(Commit.author_login)).label("contributors"),
            )
            .join(Repository, Repository.id == Commit.repository_id)
            .where(Repository.workspace_id == workspace_id)
            .where(Commit.author_date.is_not(None))
            .where(Commit.author_date >= since)
        )
        if organization:
            commit_stmt = commit_stmt.where(Repository.owner == organization)

        commit_row = session.exec(commit_stmt).one()

        # --- PRs opened ---
        pr_opened_stmt = (
            select(func.count(PullRequest.id))
            .where(PullRequest.workspace_id == workspace_id)
            .where(PullRequest.created_at >= since)
        )
        if organization:
            pr_opened_stmt = pr_opened_stmt.where(
                PullRequest.repository_full_name.like(f"{organization}/%")
            )
        prs_opened = session.exec(pr_opened_stmt).one() or 0

        # --- PRs merged ---
        pr_merged_stmt = (
            select(func.count(PullRequest.id))
            .where(PullRequest.workspace_id == workspace_id)
            .where(PullRequest.merged == True)  # noqa: E712
            .where(PullRequest.merged_at >= since)
        )
        if organization:
            pr_merged_stmt = pr_merged_stmt.where(
                PullRequest.repository_full_name.like(f"{organization}/%")
            )
        prs_merged = session.exec(pr_merged_stmt).one() or 0

        # --- Issues opened (excluding PRs) ---
        issue_stmt = (
            select(func.count(Issue.id))
            .where(Issue.workspace_id == workspace_id)
            .where(Issue.is_pull_request == False)  # noqa: E712
            .where(Issue.created_at >= since)
        )
        if organization:
            issue_stmt = issue_stmt.where(
                Issue.repository_full_name.like(f"{organization}/%")
            )
        issues_opened = session.exec(issue_stmt).one() or 0

        # --- Workflow runs in period ---
        wr_stmt = (
            select(WorkflowRun)
            .where(WorkflowRun.workspace_id == workspace_id)
            .where(WorkflowRun.created_at >= since)
        )
        if organization:
            wr_stmt = wr_stmt.where(
                WorkflowRun.repository_full_name.like(f"{organization}/%")
            )
        wr_rows = session.exec(wr_stmt).all()

        workflow_runs = len(wr_rows)
        wr_success = sum(
            1 for r in wr_rows if r.status == "completed" and r.conclusion == "success"
        )
        wr_completed = sum(1 for r in wr_rows if r.status == "completed")
        workflow_success_rate = (
            round((wr_success / wr_completed) * 100, 1) if wr_completed > 0 else 0.0
        )

    return OrgOverviewStats(
        days=days,
        active_repos=commit_row.active_repos or 0,
        contributors=commit_row.contributors or 0,
        commits=commit_row.commits or 0,
        prs_opened=prs_opened,
        prs_merged=prs_merged,
        issues_opened=issues_opened,
        workflow_runs=workflow_runs,
        workflow_success_rate=workflow_success_rate,
    )


def query_user_activity_stats(
    workspace_id: int,
    login: str,
    organization: Optional[str] = None,
    days: int = 90,
) -> UserActivityStats:
    """
    Returns activity stats for a single contributor over the last `days` days:
    commits, PRs opened/merged, lines added/removed, repos contributed to,
    and average hours to merge.
    """
    since = datetime.utcnow() - timedelta(days=days)

    with get_session() as session:
        # --- Commit stats ---
        commit_stmt = (
            select(
                func.count(func.distinct(Commit.sha)).label("commits"),
                func.count(func.distinct(Commit.repository_id)).label(
                    "repos_contributed"
                ),
                func.sum(func.coalesce(Commit.additions, 0)).label("total_additions"),
                func.sum(func.coalesce(Commit.deletions, 0)).label("total_deletions"),
            )
            .join(Repository, Repository.id == Commit.repository_id)
            .where(Repository.workspace_id == workspace_id)
            .where(Commit.author_login == login)
            .where(Commit.author_date.is_not(None))
            .where(Commit.author_date >= since)
        )
        if organization:
            commit_stmt = commit_stmt.where(Repository.owner == organization)

        commit_row = session.exec(commit_stmt).one()

        # --- PRs opened ---
        pr_base = (
            select(PullRequest)
            .where(PullRequest.workspace_id == workspace_id)
            .where(PullRequest.author == login)
            .where(PullRequest.created_at >= since)
        )
        if organization:
            pr_base = pr_base.where(
                PullRequest.repository_full_name.like(f"{organization}/%")
            )
        pr_rows = session.exec(pr_base).all()

        prs_opened = len(pr_rows)
        prs_merged = sum(1 for r in pr_rows if r.merged)
        merge_durations = [
            (r.merged_at - r.created_at).total_seconds() / 3600.0
            for r in pr_rows
            if r.merged and r.merged_at and r.created_at and r.merged_at > r.created_at
        ]
        avg_hours_to_merge = (
            round(sum(merge_durations) / len(merge_durations), 1)
            if merge_durations
            else None
        )

    return UserActivityStats(
        login=login,
        days=days,
        commits=commit_row.commits or 0,
        prs_opened=prs_opened,
        prs_merged=prs_merged,
        total_additions=commit_row.total_additions or 0,
        total_deletions=commit_row.total_deletions or 0,
        repos_contributed=commit_row.repos_contributed or 0,
        avg_hours_to_merge=avg_hours_to_merge,
    )


def query_user_lines_by_repo(
    workspace_id: int,
    login: str,
    organization: Optional[str] = None,
    days: int = 90,
    limit: int = 20,
) -> list[UserLinesByRepoPoint]:
    """
    Returns per-repository line addition/deletion breakdown for a contributor
    over the last `days` days, sorted by additions descending.
    """
    since = datetime.utcnow() - timedelta(days=days)

    with get_session() as session:
        stmt = (
            select(
                Repository.full_name.label("repo_full_name"),
                func.sum(func.coalesce(Commit.additions, 0)).label("additions"),
                func.sum(func.coalesce(Commit.deletions, 0)).label("deletions"),
                func.count(func.distinct(Commit.sha)).label("commits"),
            )
            .join(Repository, Repository.id == Commit.repository_id)
            .where(Repository.workspace_id == workspace_id)
            .where(Commit.author_login == login)
            .where(Commit.author_date.is_not(None))
            .where(Commit.author_date >= since)
            .group_by(Repository.full_name)
            .order_by(func.sum(func.coalesce(Commit.additions, 0)).desc())
            .limit(limit)
        )
        if organization:
            stmt = stmt.where(Repository.owner == organization)

        rows = session.exec(stmt).all()

    return [
        UserLinesByRepoPoint(
            repo_full_name=row.repo_full_name,
            additions=row.additions or 0,
            deletions=row.deletions or 0,
            commits=row.commits or 0,
        )
        for row in rows
    ]


def query_weekly_activity(
    workspace_id: int,
    organization: Optional[str] = None,
    weeks: int = 12,
) -> list[WeeklyActivityPoint]:
    """
    Returns per-week counts of commits, PRs opened, PRs merged, and
    workflow runs for the last `weeks` weeks, sorted oldest-first.
    """
    since = datetime.utcnow() - timedelta(weeks=weeks)

    with get_session() as session:
        # --- commits by week ---
        commit_week = func.date_trunc("week", Commit.author_date)
        commit_stmt = (
            select(
                commit_week.label("week"),
                func.count(func.distinct(Commit.sha)).label("commits"),
            )
            .join(Repository, Repository.id == Commit.repository_id)
            .where(Repository.workspace_id == workspace_id)
            .where(Commit.author_date.is_not(None))
            .where(Commit.author_date >= since)
            .group_by(commit_week)
        )
        if organization:
            commit_stmt = commit_stmt.where(Repository.owner == organization)
        commit_rows = {
            str(r.week.date()): r.commits for r in session.exec(commit_stmt).all()
        }

        # --- PRs opened by week ---
        pr_open_week = func.date_trunc("week", PullRequest.created_at)
        pr_open_stmt = (
            select(
                pr_open_week.label("week"),
                func.count(PullRequest.id).label("prs_opened"),
            )
            .where(PullRequest.workspace_id == workspace_id)
            .where(PullRequest.created_at.is_not(None))
            .where(PullRequest.created_at >= since)
            .group_by(pr_open_week)
        )
        if organization:
            pr_open_stmt = pr_open_stmt.where(
                PullRequest.repository_full_name.like(f"{organization}/%")
            )
        pr_open_rows = {
            str(r.week.date()): r.prs_opened for r in session.exec(pr_open_stmt).all()
        }

        # --- PRs merged by week ---
        pr_merge_week = func.date_trunc("week", PullRequest.merged_at)
        pr_merge_stmt = (
            select(
                pr_merge_week.label("week"),
                func.count(PullRequest.id).label("prs_merged"),
            )
            .where(PullRequest.workspace_id == workspace_id)
            .where(PullRequest.merged == True)  # noqa: E712
            .where(PullRequest.merged_at.is_not(None))
            .where(PullRequest.merged_at >= since)
            .group_by(pr_merge_week)
        )
        if organization:
            pr_merge_stmt = pr_merge_stmt.where(
                PullRequest.repository_full_name.like(f"{organization}/%")
            )
        pr_merge_rows = {
            str(r.week.date()): r.prs_merged for r in session.exec(pr_merge_stmt).all()
        }

        # --- Workflow runs by week ---
        wr_week = func.date_trunc("week", WorkflowRun.created_at)
        wr_stmt = (
            select(
                wr_week.label("week"),
                func.count(WorkflowRun.id).label("workflow_runs"),
            )
            .where(WorkflowRun.workspace_id == workspace_id)
            .where(WorkflowRun.created_at.is_not(None))
            .where(WorkflowRun.created_at >= since)
            .group_by(wr_week)
        )
        if organization:
            wr_stmt = wr_stmt.where(
                WorkflowRun.repository_full_name.like(f"{organization}/%")
            )
        wr_rows = {
            str(r.week.date()): r.workflow_runs for r in session.exec(wr_stmt).all()
        }

    # Collect all weeks that appear in any metric
    all_weeks = sorted(
        set(commit_rows) | set(pr_open_rows) | set(pr_merge_rows) | set(wr_rows)
    )

    return [
        WeeklyActivityPoint(
            week=w,
            commits=commit_rows.get(w, 0),
            prs_opened=pr_open_rows.get(w, 0),
            prs_merged=pr_merge_rows.get(w, 0),
            workflow_runs=wr_rows.get(w, 0),
        )
        for w in all_weeks
    ]


_LANGUAGE_COLORS: dict[str, str] = {
    "Python": "#3572A5",
    "JavaScript": "#f1e05a",
    "TypeScript": "#2b7489",
    "Java": "#b07219",
    "Go": "#00ADD8",
    "Rust": "#dea584",
    "C++": "#f34b7d",
    "C": "#555555",
    "Ruby": "#701516",
    "PHP": "#4F5D95",
    "Swift": "#ffac45",
    "Kotlin": "#F18E33",
    "C#": "#178600",
    "HTML": "#e34c26",
    "CSS": "#563d7c",
    "Shell": "#89e051",
    "Scala": "#c22d40",
    "R": "#198CE7",
    "Dart": "#00B4AB",
    "Vue": "#41b883",
}
_FALLBACK_COLORS = [
    "#6366f1",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#84cc16",
    "#06b6d4",
    "#a855f7",
    "#ef4444",
]


def query_language_distribution(
    workspace_id: int,
    organization: Optional[str] = None,
) -> list[LanguageDistributionPoint]:
    """
    Returns language distribution across repositories in the workspace/org,
    ordered by repo count descending, with computed percentages and colors.
    """
    statement = (
        select(
            Repository.language,
            func.count(Repository.id).label("count"),
        )
        .where(Repository.workspace_id == workspace_id)
        .where(Repository.language.is_not(None))
        .where(Repository.language != "")
        .group_by(Repository.language)
        .order_by(func.count(Repository.id).desc())
    )
    if organization:
        statement = statement.where(Repository.owner == organization)

    with get_session() as session:
        rows = session.exec(statement).all()

    if not rows:
        return []

    total = sum(r.count for r in rows)
    result = []
    fallback_idx = 0
    for r in rows:
        color = _LANGUAGE_COLORS.get(r.language)
        if color is None:
            color = _FALLBACK_COLORS[fallback_idx % len(_FALLBACK_COLORS)]
            fallback_idx += 1
        result.append(
            LanguageDistributionPoint(
                language=r.language,
                count=r.count,
                percentage=round((r.count / total) * 100, 1),
                color=color,
            )
        )
    return result


def _repo_name(full_name: str) -> str:
    """Extract the short repo name from 'owner/repo'."""
    return full_name.split("/")[-1] if "/" in full_name else full_name


def query_recent_activity(
    workspace_id: int,
    organization: Optional[str] = None,
    repository: Optional[str] = None,
    user: Optional[str] = None,
    days: int = 30,
    limit: int = 20,
) -> list[ActivityEventItem]:
    """
    Returns a merged, time-sorted feed of recent activity events from:
    - Push events
    - PRs opened
    - PRs merged
    - Issues opened
    - Issues closed
    - Tags/releases created

    Supports filtering by organization, repository (short name), and user login.
    """
    since = datetime.utcnow() - timedelta(days=days)
    events: list[ActivityEventItem] = []

    def _org_filter_full_name(col):
        """WHERE clause for repository_full_name scoped to org/repo filters."""
        clauses = []
        if organization:
            clauses.append(col.like(f"{organization}/%"))
        if repository:
            if organization:
                clauses.append(col == f"{organization}/{repository}")
            else:
                clauses.append(col.like(f"%/{repository}"))
        return clauses

    with get_session() as session:
        # --- Push events ---
        push_stmt = (
            select(Push)
            .where(Push.workspace_id == workspace_id)
            .where(Push.pushed_at.is_not(None))
            .where(Push.pushed_at >= since)
        )
        for clause in _org_filter_full_name(Push.repository_full_name):
            push_stmt = push_stmt.where(clause)
        if user:
            push_stmt = push_stmt.where(Push.pusher == user)
        for r in session.exec(push_stmt).all():
            count = r.commit_count or 1
            branch = r.branch_name or r.ref
            events.append(
                ActivityEventItem(
                    id=f"push_{r.id}",
                    type="push",
                    actor=r.pusher,
                    repo=_repo_name(r.repository_full_name),
                    repo_full_name=r.repository_full_name,
                    message=f"Pushed {count} commit{'s' if count != 1 else ''} to {branch}",
                    timestamp=r.pushed_at,
                )
            )

        # --- PRs opened ---
        pr_open_stmt = (
            select(PullRequest)
            .where(PullRequest.workspace_id == workspace_id)
            .where(PullRequest.created_at.is_not(None))
            .where(PullRequest.created_at >= since)
        )
        for clause in _org_filter_full_name(PullRequest.repository_full_name):
            pr_open_stmt = pr_open_stmt.where(clause)
        if user:
            pr_open_stmt = pr_open_stmt.where(PullRequest.author == user)
        for r in session.exec(pr_open_stmt).all():
            events.append(
                ActivityEventItem(
                    id=f"pr_opened_{r.id}",
                    type="pr_opened",
                    actor=r.author,
                    repo=_repo_name(r.repository_full_name),
                    repo_full_name=r.repository_full_name,
                    message=f"Opened PR: {r.title}",
                    title=r.title,
                    timestamp=r.created_at,
                )
            )

        # --- PRs merged ---
        pr_merge_stmt = (
            select(PullRequest)
            .where(PullRequest.workspace_id == workspace_id)
            .where(PullRequest.merged == True)  # noqa: E712
            .where(PullRequest.merged_at.is_not(None))
            .where(PullRequest.merged_at >= since)
        )
        for clause in _org_filter_full_name(PullRequest.repository_full_name):
            pr_merge_stmt = pr_merge_stmt.where(clause)
        if user:
            pr_merge_stmt = pr_merge_stmt.where(
                (PullRequest.author == user) | (PullRequest.merged_by == user)
            )
        for r in session.exec(pr_merge_stmt).all():
            actor = r.merged_by or r.author
            events.append(
                ActivityEventItem(
                    id=f"pr_merged_{r.id}",
                    type="pr_merged",
                    actor=actor,
                    repo=_repo_name(r.repository_full_name),
                    repo_full_name=r.repository_full_name,
                    message=f"Merged PR: {r.title}",
                    title=r.title,
                    timestamp=r.merged_at,
                )
            )

        # --- Issues opened ---
        issue_open_stmt = (
            select(Issue)
            .where(Issue.workspace_id == workspace_id)
            .where(Issue.is_pull_request == False)  # noqa: E712
            .where(Issue.created_at.is_not(None))
            .where(Issue.created_at >= since)
        )
        for clause in _org_filter_full_name(Issue.repository_full_name):
            issue_open_stmt = issue_open_stmt.where(clause)
        if user:
            issue_open_stmt = issue_open_stmt.where(Issue.author == user)
        for r in session.exec(issue_open_stmt).all():
            events.append(
                ActivityEventItem(
                    id=f"issue_opened_{r.id}",
                    type="issue_opened",
                    actor=r.author,
                    repo=_repo_name(r.repository_full_name),
                    repo_full_name=r.repository_full_name,
                    message=f"Opened: {r.title}",
                    title=r.title,
                    timestamp=r.created_at,
                )
            )

        # --- Issues closed ---
        issue_close_stmt = (
            select(Issue)
            .where(Issue.workspace_id == workspace_id)
            .where(Issue.is_pull_request == False)  # noqa: E712
            .where(Issue.state == "closed")
            .where(Issue.closed_at.is_not(None))
            .where(Issue.closed_at >= since)
        )
        for clause in _org_filter_full_name(Issue.repository_full_name):
            issue_close_stmt = issue_close_stmt.where(clause)
        if user:
            issue_close_stmt = issue_close_stmt.where(
                (Issue.author == user) | (Issue.closed_by == user)
            )
        for r in session.exec(issue_close_stmt).all():
            actor = r.closed_by or r.author
            events.append(
                ActivityEventItem(
                    id=f"issue_closed_{r.id}",
                    type="issue_closed",
                    actor=actor,
                    repo=_repo_name(r.repository_full_name),
                    repo_full_name=r.repository_full_name,
                    message=f"Closed: {r.title}",
                    title=r.title,
                    timestamp=r.closed_at,
                )
            )

        # --- Releases (tags) ---
        tag_stmt = (
            select(Tag)
            .where(Tag.workspace_id == workspace_id)
            .where(Tag.created_at.is_not(None))
            .where(Tag.created_at >= since)
            .where(Tag.status == "active")
        )
        for clause in _org_filter_full_name(Tag.repository_full_name):
            tag_stmt = tag_stmt.where(clause)
        if user:
            tag_stmt = tag_stmt.where(Tag.created_by == user)
        for r in session.exec(tag_stmt).all():
            actor = r.created_by or "unknown"
            events.append(
                ActivityEventItem(
                    id=f"release_{r.id}",
                    type="release",
                    actor=actor,
                    repo=_repo_name(r.repository_full_name),
                    repo_full_name=r.repository_full_name,
                    message=f"Released {r.name}",
                    title=r.name,
                    timestamp=r.created_at,
                )
            )

    events.sort(key=lambda e: e.timestamp, reverse=True)
    return events[:limit]


def query_pr_cycle_time(
    workspace_id: int,
    organization: Optional[str] = None,
    repository: Optional[str] = None,
    weeks: int = 12,
) -> list[PRCycleTimePoint]:
    """
    Returns per-week average and median PR cycle time (hours from created_at to
    merged_at) for merged PRs over the last `weeks` weeks, sorted oldest-first.
    """
    since = datetime.utcnow() - timedelta(weeks=weeks)

    cycle_hours_expr = (
        func.extract("epoch", PullRequest.merged_at - PullRequest.created_at) / 3600.0
    )
    week_expr = func.date_trunc("week", PullRequest.merged_at)

    statement = (
        select(
            week_expr.label("week"),
            func.avg(cycle_hours_expr).label("avg_hours"),
            func.percentile_cont(0.5)
            .within_group(cycle_hours_expr.asc())
            .label("median_hours"),
        )
        .where(PullRequest.workspace_id == workspace_id)
        .where(PullRequest.merged == True)  # noqa: E712
        .where(PullRequest.merged_at.is_not(None))
        .where(PullRequest.created_at.is_not(None))
        .where(PullRequest.merged_at >= since)
        .group_by(week_expr)
        .order_by(week_expr.asc())
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

    with get_session() as session:
        rows = session.exec(statement).all()

    return [
        PRCycleTimePoint(
            week=str(row.week.date()),
            avg_hours=round(float(row.avg_hours), 2),
            median_hours=round(float(row.median_hours), 2),
        )
        for row in rows
    ]


def query_contributions_by_date(
    workspace_id: int,
    organization: Optional[str] = None,
    repository: Optional[str] = None,
    author: Optional[str] = None,
    days: int = 365,
) -> list[ContributionsByDatePoint]:
    """
    Returns per-day contribution counts broken down by type for the last `days` days:
      - commits
      - prs_merged
      - issues_opened  (non-PR issues created)
      - pr_reviews     (review submissions + inline review comments combined)
      - issue_comments

    Supports filtering by organization, repository, and author.
    """
    since = datetime.utcnow() - timedelta(days=days)

    # Bucket keyed by ISO date string; values are mutable dicts.
    buckets: dict[str, dict] = {}

    def _bucket(d: str) -> dict:
        if d not in buckets:
            buckets[d] = {
                "commits": 0,
                "prs_merged": 0,
                "issues_opened": 0,
                "pr_reviews": 0,
                "issue_comments": 0,
            }
        return buckets[d]

    def _repo_filter(stmt, col):
        """Apply org/repo WHERE clauses against a repository_full_name column."""
        if organization:
            stmt = stmt.where(col.like(f"{organization}/%"))
        if repository:
            if organization:
                stmt = stmt.where(col == f"{organization}/{repository}")
            else:
                stmt = stmt.where(col.like(f"%/{repository}"))
        return stmt

    with get_session() as session:
        # 1. Commits — join through Repository for org/repo filter
        date_expr = func.date(Commit.author_date)
        commit_stmt = (
            select(date_expr.label("d"), func.count(Commit.sha).label("n"))
            .join(Repository, Repository.id == Commit.repository_id)
            .where(Repository.workspace_id == workspace_id)
            .where(Commit.author_date.is_not(None))
            .where(Commit.author_date >= since)
            .group_by(date_expr)
        )
        if organization:
            commit_stmt = commit_stmt.where(Repository.owner == organization)
        if repository:
            commit_stmt = commit_stmt.where(Repository.name == repository)
        if author:
            commit_stmt = commit_stmt.where(Commit.author_login == author)
        for row in session.exec(commit_stmt).all():
            _bucket(str(row.d))["commits"] += row.n

        # 2. PRs merged
        date_expr = func.date(PullRequest.merged_at)
        pr_stmt = (
            select(date_expr.label("d"), func.count(PullRequest.id).label("n"))
            .where(PullRequest.workspace_id == workspace_id)
            .where(PullRequest.merged == True)  # noqa: E712
            .where(PullRequest.merged_at.is_not(None))
            .where(PullRequest.merged_at >= since)
            .group_by(date_expr)
        )
        pr_stmt = _repo_filter(pr_stmt, PullRequest.repository_full_name)
        if author:
            pr_stmt = pr_stmt.where(PullRequest.author == author)
        for row in session.exec(pr_stmt).all():
            _bucket(str(row.d))["prs_merged"] += row.n

        # 3. Issues opened (non-PR)
        date_expr = func.date(Issue.created_at)
        issue_stmt = (
            select(date_expr.label("d"), func.count(Issue.id).label("n"))
            .where(Issue.workspace_id == workspace_id)
            .where(Issue.is_pull_request == False)  # noqa: E712
            .where(Issue.created_at.is_not(None))
            .where(Issue.created_at >= since)
            .group_by(date_expr)
        )
        issue_stmt = _repo_filter(issue_stmt, Issue.repository_full_name)
        if author:
            issue_stmt = issue_stmt.where(Issue.author == author)
        for row in session.exec(issue_stmt).all():
            _bucket(str(row.d))["issues_opened"] += row.n

        # 4a. PR review submissions
        date_expr = func.date(PullRequestReview.submitted_at)
        review_stmt = (
            select(date_expr.label("d"), func.count(PullRequestReview.id).label("n"))
            .where(PullRequestReview.workspace_id == workspace_id)
            .where(PullRequestReview.submitted_at.is_not(None))
            .where(PullRequestReview.submitted_at >= since)
            .group_by(date_expr)
        )
        review_stmt = _repo_filter(review_stmt, PullRequestReview.repository_full_name)
        if author:
            review_stmt = review_stmt.where(PullRequestReview.reviewer == author)
        for row in session.exec(review_stmt).all():
            _bucket(str(row.d))["pr_reviews"] += row.n

        # 4b. PR inline review comments (accumulated into pr_reviews)
        date_expr = func.date(PullRequestReviewComment.created_at)
        rc_stmt = (
            select(
                date_expr.label("d"),
                func.count(PullRequestReviewComment.id).label("n"),
            )
            .where(PullRequestReviewComment.workspace_id == workspace_id)
            .where(PullRequestReviewComment.created_at.is_not(None))
            .where(PullRequestReviewComment.created_at >= since)
            .group_by(date_expr)
        )
        rc_stmt = _repo_filter(rc_stmt, PullRequestReviewComment.repository_full_name)
        if author:
            rc_stmt = rc_stmt.where(PullRequestReviewComment.author == author)
        for row in session.exec(rc_stmt).all():
            _bucket(str(row.d))["pr_reviews"] += row.n

        # 5. Issue comments
        date_expr = func.date(IssueComment.created_at)
        ic_stmt = (
            select(date_expr.label("d"), func.count(IssueComment.id).label("n"))
            .where(IssueComment.workspace_id == workspace_id)
            .where(IssueComment.created_at.is_not(None))
            .where(IssueComment.created_at >= since)
            .group_by(date_expr)
        )
        ic_stmt = _repo_filter(ic_stmt, IssueComment.repository_full_name)
        if author:
            ic_stmt = ic_stmt.where(IssueComment.author == author)
        for row in session.exec(ic_stmt).all():
            _bucket(str(row.d))["issue_comments"] += row.n

    return [
        ContributionsByDatePoint(
            date=d,
            commits=v["commits"],
            prs_merged=v["prs_merged"],
            issues_opened=v["issues_opened"],
            pr_reviews=v["pr_reviews"],
            issue_comments=v["issue_comments"],
        )
        for d, v in sorted(buckets.items())
    ]
