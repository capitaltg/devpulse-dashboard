from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.pull_request import PullRequest


def from_webhook(
    raw: dict, repository: dict, workspace_id: int, sender: Optional[str], action: str
) -> PullRequest:
    """Map a GitHub `pull_request` payload object to a PullRequest model instance."""
    return PullRequest(
        id=raw["id"],
        number=raw["number"],
        state=raw.get("state", "open"),
        title=raw.get("title", ""),
        body=raw.get("body"),
        repository_id=repository["id"],
        repository_full_name=repository.get("full_name", ""),
        author=raw.get("user", {}).get("login", ""),
        author_id=raw.get("user", {}).get("id"),
        head_ref=raw.get("head", {}).get("ref"),
        head_sha=raw.get("head", {}).get("sha"),
        base_ref=raw.get("base", {}).get("ref"),
        base_sha=raw.get("base", {}).get("sha"),
        created_at=parse_dt(raw.get("created_at")),
        updated_at=parse_dt(raw.get("updated_at")),
        closed_at=parse_dt(raw.get("closed_at")),
        merged_at=parse_dt(raw.get("merged_at")),
        draft=raw.get("draft", False),
        merged=raw.get("merged", False),
        mergeable=raw.get("mergeable"),
        rebaseable=raw.get("rebaseable"),
        mergeable_state=raw.get("mergeable_state"),
        merged_by=(raw.get("merged_by") or {}).get("login"),
        merge_commit_sha=raw.get("merge_commit_sha"),
        comments=raw.get("comments", 0),
        review_comments=raw.get("review_comments", 0),
        commits=raw.get("commits", 0),
        additions=raw.get("additions", 0),
        deletions=raw.get("deletions", 0),
        changed_files=raw.get("changed_files", 0),
        labels=[label["name"] for label in raw.get("labels", [])],
        assignees=[a["login"] for a in raw.get("assignees", [])],
        requested_reviewers=[r["login"] for r in raw.get("requested_reviewers", [])],
        last_event_action=action,
        last_event_sender=sender,
        processed_at=datetime.now(timezone.utc),
        workspace_id=workspace_id,
    )
