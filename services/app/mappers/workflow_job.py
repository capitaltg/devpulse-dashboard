from datetime import datetime, timezone
from typing import Optional

from app.mappers.common import parse_dt
from app.models.workflow_job import WorkflowJob


def from_webhook(
    raw: dict, repository: dict, workspace_id: int, sender: Optional[str], action: str
) -> WorkflowJob:
    """Map a GitHub `workflow_job` payload object to a WorkflowJob model instance."""
    steps = raw.get("steps") or []
    steps_completed = sum(1 for s in steps if s.get("status") == "completed")

    return WorkflowJob(
        id=raw["id"],
        name=raw.get("name", ""),
        workflow_name=raw.get("workflow_name"),
        run_id=raw.get("run_id", 0),
        run_attempt=raw.get("run_attempt", 1),
        repository_id=repository["id"],
        repository_full_name=repository.get("full_name", ""),
        head_sha=raw.get("head_sha", ""),
        head_branch=raw.get("head_branch"),
        status=raw.get("status", ""),
        conclusion=raw.get("conclusion"),
        created_at=parse_dt(raw.get("created_at")),
        started_at=parse_dt(raw.get("started_at")),
        completed_at=parse_dt(raw.get("completed_at")),
        html_url=raw.get("html_url"),
        check_run_url=raw.get("check_run_url"),
        runner_id=raw.get("runner_id"),
        runner_name=raw.get("runner_name"),
        runner_group_id=raw.get("runner_group_id"),
        runner_group_name=raw.get("runner_group_name"),
        labels=raw.get("labels", []),
        steps_count=len(steps),
        steps_completed=steps_completed,
        last_event_action=action,
        last_event_sender=sender,
        processed_at=datetime.now(timezone.utc),
        workspace_id=workspace_id,
    )
