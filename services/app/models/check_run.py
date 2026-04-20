from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Field, SQLModel


class CheckRun(SQLModel, table=True):
    __tablename__ = "check_runs"

    id: int = Field(primary_key=True)
    name: str
    check_suite_id: Optional[int] = None
    repository_id: int = Field(index=True)
    repository_full_name: str = Field(index=True)
    head_sha: str = Field(index=True)
    head_branch: Optional[str] = Field(default=None, index=True)
    status: str = Field(index=True)
    conclusion: Optional[str] = Field(default=None, index=True)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    details_url: Optional[str] = None
    html_url: Optional[str] = None
    external_id: Optional[str] = None
    app_id: Optional[int] = None
    app_name: Optional[str] = None
    app_slug: Optional[str] = None
    output_title: Optional[str] = None
    output_summary: Optional[str] = None
    output_text: Optional[str] = None
    annotations_count: Optional[int] = 0
    pull_request_numbers: Optional[List[int]] = Field(
        default=None, sa_column=Column(ARRAY(Integer))
    )
    last_event_action: Optional[str] = None
    last_event_sender: Optional[str] = None
    processed_at: Optional[datetime] = Field(default=None, index=True)
    workspace_id: int
