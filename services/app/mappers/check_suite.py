from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.check_suite import CheckSuite


def from_webhook(
    raw: dict, repository: dict, workspace_id: int, sender: Optional[str], action: str
) -> CheckSuite:
    """Map a GitHub `check_suite` payload object to a CheckSuite model instance."""
    app = raw.get("app") or {}

    return CheckSuite(
        id=raw["id"],
        repository_id=repository["id"],
        repository_full_name=repository.get("full_name", ""),
        head_sha=raw.get("head_sha", ""),
        head_branch=raw.get("head_branch"),
        status=raw.get("status", ""),
        conclusion=raw.get("conclusion"),
        created_at=parse_dt(raw.get("created_at")),
        updated_at=parse_dt(raw.get("updated_at")),
        url=raw.get("url"),
        app_id=app.get("id"),
        app_name=app.get("name"),
        app_slug=app.get("slug"),
        before_sha=raw.get("before"),
        after_sha=raw.get("after"),
        pull_request_numbers=[pr["number"] for pr in raw.get("pull_requests", [])],
        last_event_action=action,
        last_event_sender=sender,
        processed_at=datetime.now(timezone.utc),
        workspace_id=workspace_id,
    )
