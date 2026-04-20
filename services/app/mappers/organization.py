from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.organization import Organization


def from_webhook(
    raw: dict, workspace_id: int, sender: Optional[str], action: str
) -> Organization:
    """Map a GitHub `organization` or `owner` payload object to an Organization model instance."""
    return Organization(
        id=raw["id"],
        workspace_id=workspace_id,
        login=raw.get("login", ""),
        node_id=raw.get("node_id"),
        name=raw.get("name"),
        description=raw.get("description"),
        type=raw.get("type"),
        company=raw.get("company"),
        blog=raw.get("blog"),
        location=raw.get("location"),
        email=raw.get("email"),
        twitter_username=raw.get("twitter_username"),
        is_verified=raw.get("is_verified", False),
        avatar_url=raw.get("avatar_url"),
        url=raw.get("url"),
        html_url=raw.get("html_url"),
        repos_url=raw.get("repos_url"),
        events_url=raw.get("events_url"),
        hooks_url=raw.get("hooks_url"),
        issues_url=raw.get("issues_url"),
        members_url=raw.get("members_url"),
        public_members_url=raw.get("public_members_url"),
        has_organization_projects=raw.get("has_organization_projects", True),
        has_repository_projects=raw.get("has_repository_projects", True),
        public_repos=raw.get("public_repos", 0),
        public_gists=raw.get("public_gists", 0),
        followers=raw.get("followers", 0),
        following=raw.get("following", 0),
        created_at=parse_dt(raw.get("created_at")),
        updated_at=parse_dt(raw.get("updated_at")),
        archived_at=parse_dt(raw.get("archived_at")),
        last_event_action=action,
        last_event_sender=sender,
        processed_at=datetime.now(timezone.utc),
    )
