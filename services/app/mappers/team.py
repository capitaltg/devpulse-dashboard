from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.team import Team


def from_webhook(
    raw: dict, organization: dict, workspace_id: int, sender: Optional[str], action: str
) -> Team:
    """Map a GitHub `team` payload object to a Team model instance."""
    parent = raw.get("parent") or {}
    return Team(
        id=raw["id"],
        node_id=raw.get("node_id"),
        name=raw.get("name", ""),
        slug=raw.get("slug", ""),
        description=raw.get("description"),
        organization_id=organization["id"],
        privacy=raw.get("privacy"),
        notification_setting=raw.get("notification_setting"),
        permission=raw.get("permission"),
        url=raw.get("url"),
        html_url=raw.get("html_url"),
        members_url=raw.get("members_url"),
        repositories_url=raw.get("repositories_url"),
        parent_id=parent.get("id"),
        created_at=parse_dt(raw.get("created_at")),
        updated_at=parse_dt(raw.get("updated_at")),
        last_event_action=action,
        last_event_at=datetime.now(timezone.utc),
        workspace_id=workspace_id,
    )
