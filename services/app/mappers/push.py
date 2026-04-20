from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.push import Push


def from_webhook(
    payload: dict,
    workspace_id: int,
    sender: Optional[str],
    sender_id: Optional[int],
) -> Push:
    """Map a GitHub push event payload to a Push model instance."""
    ref = payload.get("ref", "")
    after_sha = payload.get("after", "")
    raw_repo = payload.get("repository", {})
    repository_id = raw_repo["id"]
    full_name = raw_repo.get("full_name", "")

    branch_name = (
        ref.removeprefix("refs/heads/") if ref.startswith("refs/heads/") else ref
    )
    is_default_branch = branch_name == raw_repo.get("default_branch", "")

    commits = payload.get("commits", [])
    head_commit = payload.get("head_commit") or {}
    head_author = head_commit.get("author") or {}
    head_committer = head_commit.get("committer") or {}

    return Push(
        push_id=f"{repository_id}:{ref}:{after_sha}",
        ref=ref,
        before_sha=payload.get("before", ""),
        after_sha=after_sha,
        repository_id=repository_id,
        repository_full_name=full_name,
        pusher=(payload.get("pusher") or {}).get("name", ""),
        pusher_email=(payload.get("pusher") or {}).get("email"),
        sender=sender,
        sender_id=sender_id,
        branch_name=branch_name,
        is_default_branch=is_default_branch,
        created=payload.get("created", False),
        deleted=payload.get("deleted", False),
        forced=payload.get("forced", False),
        commit_count=len(commits),
        distinct_commit_count=sum(1 for c in commits if c.get("distinct", True)),
        head_commit_id=head_commit.get("id"),
        head_commit_message=head_commit.get("message"),
        head_commit_timestamp=parse_dt(head_commit.get("timestamp")),
        head_commit_author=head_author.get("username") or head_author.get("name"),
        head_commit_author_email=head_author.get("email"),
        head_commit_committer=head_committer.get("username")
        or head_committer.get("name"),
        head_commit_committer_email=head_committer.get("email"),
        head_commit_url=head_commit.get("url"),
        commit_ids=[c["id"] for c in commits if "id" in c],
        commit_messages=[c.get("message", "") for c in commits],
        compare_url=payload.get("compare"),
        pushed_at=parse_dt(raw_repo.get("pushed_at")),
        processed_at=datetime.now(timezone.utc),
        workspace_id=workspace_id,
    )
