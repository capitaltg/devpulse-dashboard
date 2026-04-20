from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.issue import Issue


def from_webhook(
    raw: dict, repository: dict, workspace_id: int, sender: Optional[str], action: str
) -> Issue:
    """Map a GitHub `issue` payload object to an Issue model instance."""
    milestone = raw.get("milestone") or {}
    reactions = raw.get("reactions") or {}
    closed_by = raw.get("closed_by") or {}
    issue_type = raw.get("type") or {}

    return Issue(
        id=raw["id"],
        number=raw["number"],
        state=raw.get("state", "open"),
        state_reason=raw.get("state_reason"),
        title=raw.get("title", ""),
        body=raw.get("body"),
        repository_id=repository["id"],
        repository_full_name=repository.get("full_name", ""),
        author=raw.get("user", {}).get("login", ""),
        author_id=raw.get("user", {}).get("id"),
        html_url=raw.get("html_url"),
        comments_url=raw.get("comments_url"),
        events_url=raw.get("events_url"),
        labels=[label["name"] for label in raw.get("labels", [])],
        assignees=[a["login"] for a in raw.get("assignees", [])],
        milestone_id=milestone.get("id"),
        milestone_title=milestone.get("title"),
        comments=raw.get("comments", 0),
        locked=raw.get("locked", False),
        active_lock_reason=raw.get("active_lock_reason"),
        closed_by=closed_by.get("login"),
        closed_by_id=closed_by.get("id"),
        reactions_total=reactions.get("total_count", 0),
        reactions_plus_one=reactions.get("+1", 0),
        reactions_minus_one=reactions.get("-1", 0),
        reactions_laugh=reactions.get("laugh", 0),
        reactions_hooray=reactions.get("hooray", 0),
        reactions_confused=reactions.get("confused", 0),
        reactions_heart=reactions.get("heart", 0),
        reactions_rocket=reactions.get("rocket", 0),
        reactions_eyes=reactions.get("eyes", 0),
        is_pull_request="pull_request" in raw,
        pull_request_url=(raw.get("pull_request") or {}).get("url"),
        type_name=issue_type.get("name"),
        created_at=parse_dt(raw.get("created_at")),
        updated_at=parse_dt(raw.get("updated_at")),
        closed_at=parse_dt(raw.get("closed_at")),
        last_event_action=action,
        last_event_sender=sender,
        processed_at=datetime.now(timezone.utc),
        workspace_id=workspace_id,
    )
