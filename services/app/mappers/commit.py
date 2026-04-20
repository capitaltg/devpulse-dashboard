from datetime import datetime, timezone

from app.mappers.common import parse_dt
from app.models.commit import Commit


def from_push(raw: dict, repository: dict) -> Commit:
    """Map a commit object from a GitHub push event payload to a Commit model instance."""
    full_name = repository.get("full_name", "")
    parts = full_name.split("/", 1)
    owner = parts[0] if parts else ""
    name = parts[1] if len(parts) > 1 else ""

    message = raw.get("message", "")
    commit_type = "merge" if message.startswith("Merge ") else "standard"

    author = raw.get("author") or {}
    committer = raw.get("committer") or {}

    return Commit(
        sha=raw["id"],
        repository_id=repository["id"],
        repository_owner=owner,
        repository_name=name,
        repository_full_name=full_name,
        message=message,
        author_date=parse_dt(raw.get("timestamp")),
        author_email=author.get("email"),
        author_login=author.get("username"),
        committer_email=committer.get("email"),
        committer_login=committer.get("username"),
        commit_type=commit_type,
        processed_at=datetime.now(timezone.utc),
        last_updated=datetime.now(timezone.utc),
    )


def from_api(commit_data: dict, repo_full_name: str) -> Commit:
    """Map a GitHub API commit response to a Commit model instance with full detail."""
    parts = repo_full_name.split("/", 1)
    owner = parts[0] if parts else ""
    name = parts[1] if len(parts) > 1 else ""

    raw_commit = commit_data.get("commit") or {}
    raw_author = commit_data.get("author") or {}
    raw_committer = commit_data.get("committer") or {}
    stats = commit_data.get("stats") or {}
    verification = raw_commit.get("verification") or {}
    commit_author = raw_commit.get("author") or {}
    commit_committer = raw_commit.get("committer") or {}

    message = raw_commit.get("message", "")
    commit_type = "merge" if message.startswith("Merge ") else "standard"

    return Commit(
        sha=commit_data["sha"],
        repository_owner=owner,
        repository_name=name,
        repository_full_name=repo_full_name,
        message=message,
        author_date=parse_dt(commit_author.get("date")),
        author_email=commit_author.get("email"),
        author_login=raw_author.get("login"),
        author_id=raw_author.get("id"),
        committer_date=parse_dt(commit_committer.get("date")),
        committer_email=commit_committer.get("email"),
        committer_login=raw_committer.get("login"),
        committer_id=raw_committer.get("id"),
        comment_count=raw_commit.get("comment_count", 0),
        total_changes=stats.get("total"),
        additions=stats.get("additions"),
        deletions=stats.get("deletions"),
        verified=verification.get("verified", False),
        verification_reason=verification.get("reason"),
        commit_type=commit_type,
        processed_at=datetime.now(timezone.utc),
        last_updated=datetime.now(timezone.utc),
    )
