from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.check_run import CheckRun


def from_webhook(
    raw: dict, repository: dict, workspace_id: int, sender: Optional[str], action: str
) -> CheckRun:
    """Map a GitHub `check_run` payload object to a CheckRun model instance."""
    app = raw.get("app") or {}
    output = raw.get("output") or {}
    check_suite = raw.get("check_suite") or {}

    return CheckRun(
        id=raw["id"],
        name=raw.get("name", ""),
        check_suite_id=check_suite.get("id"),
        repository_id=repository["id"],
        repository_full_name=repository.get("full_name", ""),
        head_sha=raw.get("head_sha", ""),
        head_branch=raw.get("head_branch") or check_suite.get("head_branch"),
        status=raw.get("status", ""),
        conclusion=raw.get("conclusion"),
        started_at=parse_dt(raw.get("started_at")),
        completed_at=parse_dt(raw.get("completed_at")),
        details_url=raw.get("details_url"),
        html_url=raw.get("html_url"),
        external_id=raw.get("external_id"),
        app_id=app.get("id"),
        app_name=app.get("name"),
        app_slug=app.get("slug"),
        output_title=output.get("title"),
        output_summary=output.get("summary"),
        output_text=output.get("text"),
        annotations_count=output.get("annotations_count", 0),
        pull_request_numbers=[pr["number"] for pr in raw.get("pull_requests", [])],
        last_event_action=action,
        last_event_sender=sender,
        processed_at=datetime.now(timezone.utc),
        workspace_id=workspace_id,
    )
