from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.commit_comment import CommitComment


def from_webhook(
    raw: dict, repository: dict, workspace_id: int, sender: Optional[str], action: str
) -> CommitComment:
    """Map a GitHub `comment` payload object (from a commit_comment event) to a CommitComment model instance."""
    reactions = raw.get("reactions") or {}

    return CommitComment(
        id=raw["id"],
        commit_id=raw.get("commit_id", ""),
        repository_id=repository["id"],
        repository_full_name=repository.get("full_name", ""),
        author=raw.get("user", {}).get("login", ""),
        author_id=raw.get("user", {}).get("id"),
        body=raw.get("body", ""),
        path=raw.get("path"),
        position=raw.get("position"),
        line=raw.get("line"),
        html_url=raw.get("html_url"),
        commit_url=raw.get("commit_url"),
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
