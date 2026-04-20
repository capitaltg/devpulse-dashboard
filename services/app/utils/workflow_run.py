from typing import Optional

from sqlmodel import func, select

from app.db import get_session
from app.models.workflow_run import WorkflowRun

# DB conclusions that map to the "failure" UI status
_FAILURE_CONCLUSIONS = ("failure", "timed_out", "startup_failure")
# DB conclusions that map to the "cancelled" UI status
_CANCELLED_CONCLUSIONS = ("cancelled", "skipped", "neutral")


def _apply_ui_status_filter(statement, status: str):
    """Translate a UI-facing status value into DB where clauses."""
    if status == "in_progress":
        return statement.where(WorkflowRun.status.in_(["in_progress", "queued"]))
    if status == "success":
        return statement.where(WorkflowRun.status == "completed").where(
            WorkflowRun.conclusion == "success"
        )
    if status == "failure":
        return statement.where(WorkflowRun.status == "completed").where(
            WorkflowRun.conclusion.in_(list(_FAILURE_CONCLUSIONS))
        )
    if status == "cancelled":
        return statement.where(WorkflowRun.status == "completed").where(
            WorkflowRun.conclusion.in_(list(_CANCELLED_CONCLUSIONS))
        )
    return statement


def query_workflow_runs(
    workspace_id: int,
    organization: Optional[str] = None,
    repository: Optional[str] = None,
    status: Optional[str] = None,
    branch: Optional[str] = None,
    event: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 20,
    page: int = 1,
) -> tuple[list[dict], int]:
    """
    Returns (items, total_count) of workflow runs for the given workspace.

    Filters:
      organization – owner login (matches owner part of repository_full_name)
      repository   – repo name (matches name part of repository_full_name)
      status       – UI status: 'success' | 'failure' | 'in_progress' | 'cancelled'
      branch       – head_branch exact match
      event        – trigger event (push, pull_request, schedule, …)
      search       – searches workflow name, repository, and branch
    """
    with get_session() as session:
        statement = select(WorkflowRun).where(WorkflowRun.workspace_id == workspace_id)

        if organization:
            statement = statement.where(
                WorkflowRun.repository_full_name.like(f"{organization}/%")
            )

        if repository:
            statement = statement.where(
                WorkflowRun.repository_full_name.like(f"%/{repository}")
            )

        if branch:
            statement = statement.where(WorkflowRun.head_branch == branch)

        if event:
            statement = statement.where(WorkflowRun.event == event)

        if search:
            q = f"%{search.lower()}%"
            statement = statement.where(
                func.lower(WorkflowRun.name).like(q)
                | func.lower(WorkflowRun.repository_full_name).like(q)
                | func.lower(WorkflowRun.head_branch).like(q)
            )

        if status:
            statement = _apply_ui_status_filter(statement, status)

        total_count = len(session.exec(statement).all())

        statement = (
            statement.order_by(WorkflowRun.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )

        runs = session.exec(statement).all()

        return [
            {
                "id": run.id,
                "name": run.name,
                "workflow_id": run.workflow_id,
                "repository_full_name": run.repository_full_name,
                "status": run.status,
                "conclusion": run.conclusion,
                "event": run.event,
                "head_branch": run.head_branch,
                "head_sha": run.head_sha,
                "run_number": run.run_number,
                "triggering_actor_login": run.triggering_actor_login,
                "html_url": run.html_url,
                "created_at": run.created_at,
                "updated_at": run.updated_at,
                "run_started_at": run.run_started_at,
            }
            for run in runs
        ], total_count


def query_workflow_run_stats(
    workspace_id: int,
    organization: Optional[str] = None,
    repository: Optional[str] = None,
) -> dict:
    """
    Returns aggregate counts of workflow runs for the given workspace/org scope,
    mapped to the 4 UI status buckets: success, failure, in_progress, cancelled.
    """
    with get_session() as session:
        statement = select(WorkflowRun).where(WorkflowRun.workspace_id == workspace_id)

        if organization:
            statement = statement.where(
                WorkflowRun.repository_full_name.like(f"{organization}/%")
            )

        if repository:
            statement = statement.where(
                WorkflowRun.repository_full_name.like(f"%/{repository}")
            )

        runs = session.exec(statement).all()

        total = len(runs)
        success = sum(
            1 for r in runs if r.status == "completed" and r.conclusion == "success"
        )
        failure = sum(
            1
            for r in runs
            if r.status == "completed" and r.conclusion in _FAILURE_CONCLUSIONS
        )
        in_progress = sum(1 for r in runs if r.status in ("in_progress", "queued"))
        cancelled = sum(
            1
            for r in runs
            if r.status == "completed" and r.conclusion in _CANCELLED_CONCLUSIONS
        )

        completed = total - in_progress
        success_rate = round((success / completed) * 100) if completed > 0 else 0

        durations_ms = [
            (r.updated_at - r.run_started_at).total_seconds() * 1000
            for r in runs
            if r.status == "completed"
            and r.run_started_at
            and r.updated_at
            and r.updated_at > r.run_started_at
        ]
        avg_duration_ms = (
            round(sum(durations_ms) / len(durations_ms)) if durations_ms else 0
        )

        return {
            "total": total,
            "success": success,
            "failure": failure,
            "in_progress": in_progress,
            "cancelled": cancelled,
            "success_rate": success_rate,
            "avg_duration_ms": avg_duration_ms,
        }
