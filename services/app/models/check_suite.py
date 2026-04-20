from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Field, SQLModel


class CheckSuite(SQLModel, table=True):
    __tablename__ = "check_suites"

    id: int = Field(primary_key=True)
    repository_id: int = Field(index=True)
    repository_full_name: str = Field(index=True)
    head_sha: str = Field(index=True)
    head_branch: Optional[str] = Field(default=None, index=True)
    status: str = Field(index=True)
    conclusion: Optional[str] = Field(default=None, index=True)
    created_at: Optional[datetime] = Field(default=None, index=True)
    updated_at: Optional[datetime] = Field(default=None, index=True)
    url: Optional[str] = None
    app_id: Optional[int] = None
    app_name: Optional[str] = Field(default=None, index=True)
    app_slug: Optional[str] = None
    before_sha: Optional[str] = None
    after_sha: Optional[str] = None
    pull_request_numbers: Optional[List[int]] = Field(
        default=None, sa_column=Column(ARRAY(Integer))
    )
    last_event_action: Optional[str] = None
    last_event_sender: Optional[str] = None
    processed_at: Optional[datetime] = Field(default=None, index=True)
    workspace_id: int
