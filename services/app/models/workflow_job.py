from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Field, SQLModel


class WorkflowJob(SQLModel, table=True):
    __tablename__ = "workflow_jobs"

    id: int = Field(primary_key=True)
    name: str
    workflow_name: Optional[str] = None
    run_id: int = Field(index=True)
    run_attempt: Optional[int] = 1
    repository_id: int = Field(index=True)
    repository_full_name: str = Field(index=True)
    head_sha: str = Field(index=True)
    head_branch: Optional[str] = Field(default=None, index=True)
    status: str = Field(index=True)
    conclusion: Optional[str] = Field(default=None, index=True)
    created_at: Optional[datetime] = Field(default=None, index=True)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    html_url: Optional[str] = None
    check_run_url: Optional[str] = None
    runner_id: Optional[int] = None
    runner_name: Optional[str] = None
    runner_group_id: Optional[int] = None
    runner_group_name: Optional[str] = None
    labels: Optional[List[str]] = Field(default=None, sa_column=Column(ARRAY(String)))
    steps_count: Optional[int] = 0
    steps_completed: Optional[int] = 0
    last_event_action: Optional[str] = None
    last_event_sender: Optional[str] = None
    processed_at: Optional[datetime] = Field(default=None, index=True)
    workspace_id: int
