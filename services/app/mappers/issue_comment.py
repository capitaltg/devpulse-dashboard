from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.issue_comment import IssueComment


def from_webhook(
    raw: dict,
    issue: dict,
    repository: dict,
    workspace_id: int,
    sender: Optional[str],
    action: str,
) -> IssueComment:
    """Map a GitHub `comment` payload object to an IssueComment model instance."""
    reactions = raw.get("reactions") or {}

    return IssueComment(
        id=raw["id"],
        issue_id=issue["id"],
        issue_number=issue["number"],
        repository_id=repository["id"],
        repository_full_name=repository.get("full_name", ""),
        author=raw.get("user", {}).get("login", ""),
        author_id=raw.get("user", {}).get("id"),
        body=raw.get("body", ""),
        html_url=raw.get("html_url"),
        issue_url=raw.get("issue_url"),
        created_at=parse_dt(raw.get("created_at")),
        updated_at=parse_dt(raw.get("updated_at")),
        reactions_total=reactions.get("total_count", 0),
        reactions_plus_one=reactions.get("+1", 0),
        reactions_minus_one=reactions.get("-1", 0),
        reactions_laugh=reactions.get("laugh", 0),
        reactions_hooray=reactions.get("hooray", 0),
        reactions_confused=reactions.get("confused", 0),
        reactions_heart=reactions.get("heart", 0),
        reactions_rocket=reactions.get("rocket", 0),
        reactions_eyes=reactions.get("eyes", 0),
        last_event_action=action,
        last_event_sender=sender,
        processed_at=datetime.now(timezone.utc),
        workspace_id=workspace_id,
    )
