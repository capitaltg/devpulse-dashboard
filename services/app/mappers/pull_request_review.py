from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.pull_request_review import PullRequestReview


def from_webhook(
    raw: dict,
    pull_request: dict,
    repository: dict,
    workspace_id: int,
    sender: Optional[str],
    action: str,
) -> PullRequestReview:
    """Map a GitHub `review` payload object to a PullRequestReview model instance."""
    return PullRequestReview(
        id=raw["id"],
        pull_request_id=pull_request["id"],
        pull_request_number=pull_request["number"],
        repository_id=repository["id"],
        repository_full_name=repository.get("full_name", ""),
        reviewer=raw.get("user", {}).get("login", ""),
        reviewer_id=raw.get("user", {}).get("id"),
        state=raw.get("state", ""),
        body=raw.get("body"),
        html_url=raw.get("html_url"),
        pull_request_url=raw.get("pull_request_url"),
        commit_id=raw.get("commit_id"),
        submitted_at=parse_dt(raw.get("submitted_at")),
        last_event_action=action,
        last_event_sender=sender,
        processed_at=datetime.now(timezone.utc),
        workspace_id=workspace_id,
    )
