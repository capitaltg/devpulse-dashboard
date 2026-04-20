from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.repository import Repository


def from_webhook(
    raw: dict, workspace_id: int, sender: Optional[str], action: str
) -> Repository:
    """Map a GitHub `repository` payload object to a Repository model instance."""
    return Repository(
        id=raw["id"],
        workspace_id=workspace_id,
        name=raw.get("name", ""),
        full_name=raw.get("full_name", ""),
        owner=raw.get("owner", {}).get("login", ""),
        description=raw.get("description"),
        private=raw.get("private", False),
        html_url=raw.get("html_url"),
        default_branch=raw.get("default_branch", "main"),
        language=raw.get("language"),
        created_at=parse_dt(raw.get("created_at")),
        updated_at=parse_dt(raw.get("updated_at")),
        pushed_at=parse_dt(raw.get("pushed_at")),
        stargazers_count=raw.get("stargazers_count", 0),
        watchers_count=raw.get("watchers_count", 0),
        forks_count=raw.get("forks_count", 0),
        open_issues_count=raw.get("open_issues_count", 0),
        size=raw.get("size", 0),
        has_issues=raw.get("has_issues", False),
        has_projects=raw.get("has_projects", False),
        has_wiki=raw.get("has_wiki", False),
        has_pages=raw.get("has_pages", False),
        has_downloads=raw.get("has_downloads", False),
        archived=raw.get("archived", False),
        disabled=raw.get("disabled", False),
        fork=raw.get("fork", False),
        last_event_action=action,
        last_event_sender=sender,
        processed_at=datetime.now(timezone.utc),
    )
