from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Field, SQLModel


class WorkflowRun(SQLModel, table=True):
    __tablename__ = "workflow_runs"

    id: int = Field(primary_key=True)
    name: str
    workflow_id: int = Field(index=True)
    workflow_path: Optional[str] = None
    repository_id: int = Field(index=True)
    repository_full_name: str = Field(index=True)
    head_sha: str = Field(index=True)
    head_branch: Optional[str] = Field(default=None, index=True)
    head_commit_message: Optional[str] = None
    event: str = Field(index=True)
    status: str = Field(index=True)
    conclusion: Optional[str] = Field(default=None, index=True)
    run_number: int
    run_attempt: Optional[int] = 1
    created_at: Optional[datetime] = Field(default=None, index=True)
    updated_at: Optional[datetime] = None
    run_started_at: Optional[datetime] = None
    html_url: Optional[str] = None
    jobs_url: Optional[str] = None
    logs_url: Optional[str] = None
    check_suite_url: Optional[str] = None
    artifacts_url: Optional[str] = None
    cancel_url: Optional[str] = None
    rerun_url: Optional[str] = None
    workflow_url: Optional[str] = None
    triggering_actor_login: Optional[str] = None
    triggering_actor_id: Optional[int] = None
    pull_request_numbers: Optional[List[int]] = Field(
        default=None, sa_column=Column(ARRAY(Integer))
    )
    previous_attempt_url: Optional[str] = None
    last_event_action: Optional[str] = None
    last_event_sender: Optional[str] = None
    processed_at: Optional[datetime] = Field(default=None, index=True)
    workspace_id: int
