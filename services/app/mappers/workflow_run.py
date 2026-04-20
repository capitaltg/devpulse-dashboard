from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.workflow_run import WorkflowRun


def from_webhook(
    raw: dict, repository: dict, workspace_id: int, sender: Optional[str], action: str
) -> WorkflowRun:
    """Map a GitHub `workflow_run` payload object to a WorkflowRun model instance."""
    triggering_actor = raw.get("triggering_actor") or {}

    return WorkflowRun(
        id=raw["id"],
        name=raw.get("name", ""),
        workflow_id=raw.get("workflow_id", 0),
        workflow_path=raw.get("path"),
        repository_id=repository["id"],
        repository_full_name=repository.get("full_name", ""),
        head_sha=raw.get("head_sha", ""),
        head_branch=raw.get("head_branch"),
        head_commit_message=(raw.get("head_commit") or {}).get("message"),
        event=raw.get("event", ""),
        status=raw.get("status", ""),
        conclusion=raw.get("conclusion"),
        run_number=raw.get("run_number", 0),
        run_attempt=raw.get("run_attempt", 1),
        created_at=parse_dt(raw.get("created_at")),
        updated_at=parse_dt(raw.get("updated_at")),
        run_started_at=parse_dt(raw.get("run_started_at")),
        html_url=raw.get("html_url"),
        jobs_url=raw.get("jobs_url"),
        logs_url=raw.get("logs_url"),
        check_suite_url=raw.get("check_suite_url"),
        artifacts_url=raw.get("artifacts_url"),
        cancel_url=raw.get("cancel_url"),
        rerun_url=raw.get("rerun_url"),
        workflow_url=raw.get("workflow_url"),
        triggering_actor_login=triggering_actor.get("login"),
        triggering_actor_id=triggering_actor.get("id"),
        pull_request_numbers=[pr["number"] for pr in raw.get("pull_requests", [])],
        previous_attempt_url=raw.get("previous_attempt_url"),
        last_event_action=action,
        last_event_sender=sender,
        processed_at=datetime.now(timezone.utc),
        workspace_id=workspace_id,
    )
