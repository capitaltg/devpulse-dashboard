from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.pull_request_review_comment import PullRequestReviewComment


def from_webhook(
    raw: dict,
    pull_request: dict,
    repository: dict,
    workspace_id: int,
    sender: Optional[str],
    action: str,
) -> PullRequestReviewComment:
    """Map a GitHub `comment` payload object to a PullRequestReviewComment model instance."""
    return PullRequestReviewComment(
        id=raw["id"],
        pull_request_id=pull_request["id"],
        pull_request_number=pull_request["number"],
        pull_request_review_id=raw.get("pull_request_review_id"),
        repository_id=repository["id"],
        repository_full_name=repository.get("full_name", ""),
        author=raw.get("user", {}).get("login", ""),
        author_id=raw.get("user", {}).get("id"),
        body=raw.get("body", ""),
        path=raw.get("path"),
        position=raw.get("position"),
        original_position=raw.get("original_position"),
        line=raw.get("line"),
        original_line=raw.get("original_line"),
        side=raw.get("side"),
        start_line=raw.get("start_line"),
        start_side=raw.get("start_side"),
        commit_id=raw.get("commit_id"),
        original_commit_id=raw.get("original_commit_id"),
        diff_hunk=raw.get("diff_hunk"),
        in_reply_to_id=raw.get("in_reply_to_id"),
        html_url=raw.get("html_url"),
        pull_request_url=raw.get("pull_request_url"),
        created_at=parse_dt(raw.get("created_at")),
        updated_at=parse_dt(raw.get("updated_at")),
        last_event_action=action,
        last_event_sender=sender,
        processed_at=datetime.now(timezone.utc),
        workspace_id=workspace_id,
    )
