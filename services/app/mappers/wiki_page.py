from datetime import datetime, timezone
from typing import Optional

from app.models.wiki_page import WikiPage


def from_webhook(
    raw: dict,
    repository: dict,
    workspace_id: int,
    sender: Optional[str],
    sender_id: Optional[int],
) -> WikiPage:
    """Map a single GitHub gollum `pages` entry to a WikiPage model instance."""
    return WikiPage(
        repository_id=repository["id"],
        repository_full_name=repository.get("full_name", ""),
        page_name=raw.get("page_name", ""),
        title=raw.get("title"),
        action=raw.get("action", ""),
        sha=raw.get("sha", ""),
        html_url=raw.get("html_url"),
        sender=sender,
        sender_id=sender_id,
        created_at=datetime.now(timezone.utc),
        processed_at=datetime.now(timezone.utc),
        workspace_id=workspace_id,
    )
