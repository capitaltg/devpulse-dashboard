from datetime import datetime, timedelta
from typing import List, Optional

from sqlmodel import func, select

from app.db import get_session
from app.models.commit import Commit  # Assuming these exist
from app.models.pull_request import PullRequest
from app.models.repository import Repository, RepositoryPublic


def query_repositories(
    workspace_id: int,
    organization: Optional[str] = None,
    name: Optional[str] = None,
    limit: int = 20,
    page: int = 1,
    days_back: int = 90,
) -> List[RepositoryPublic]:
    """
    Returns repositories with aggregated counts for recent commits and PRs.
    """
    since_date = datetime.utcnow() - timedelta(days=days_back)
    recent_pr_count_expr = func.count(func.distinct(PullRequest.id))

    with get_session() as session:
        # 1. Define the selection with aggregation functions
        # We use func.count(distinct(...)) to avoid double-counting due to the multiple joins
        statement = (
            select(
                Repository,
                func.count(func.distinct(Commit.sha)).label("recent_commits_count"),
                recent_pr_count_expr.label("recent_pr_count"),
            )
            .where(Repository.workspace_id == workspace_id)
            .where(Repository.disabled == False)
            # 2. Join with Commits and PRs filtered by date
            .outerjoin(
                Commit,
                (Commit.repository_id == Repository.id)
                & (Commit.author_date >= since_date),
            )
            .outerjoin(
                PullRequest,
                (PullRequest.repository_id == Repository.id)
                & (PullRequest.created_at >= since_date),
            )
        )

        # 3. Apply optional filters
        if organization:
            statement = statement.where(Repository.owner == organization)

        if name:
            statement = statement.where(Repository.name == name)

        # 4. Group, sort by recent PR count then recent push date, and apply pagination
        statement = (
            statement.group_by(Repository.id)
            .order_by(Repository.pushed_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )

        results = session.exec(statement).all()

        # 5. Map the tuples (Repo, CommitCount, PRCount) into RepositoryPublic models
        return [
            RepositoryPublic(
                **repo.model_dump(),
                recent_commit_count=commit_count,
                recent_pr_count=pr_count
            )
            for repo, commit_count, pr_count in results
        ]
