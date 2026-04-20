from datetime import datetime, timezone
from typing import Optional

from app.models.external_user import User


def from_webhook(raw: dict, sender: Optional[str], action: str) -> User:
    """Map a GitHub user object to a User model instance."""
    return User(
        id=raw["id"],
        login=raw.get("login", ""),
        node_id=raw.get("node_id"),
        type=raw.get("type"),
        site_admin=raw.get("site_admin", False),
        avatar_url=raw.get("avatar_url"),
        gravatar_id=raw.get("gravatar_id"),
        last_event_action=action,
        last_event_sender=sender,
        processed_at=datetime.now(timezone.utc),
    )
