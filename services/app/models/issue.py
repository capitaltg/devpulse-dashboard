from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Field, SQLModel


class Issue(SQLModel, table=True):
    __tablename__ = "issues"

    id: int = Field(primary_key=True)
    number: int
    state: str = Field(index=True)
    state_reason: Optional[str] = None
    title: str
    body: Optional[str] = None
    repository_id: int = Field(index=True)
    repository_full_name: str = Field(index=True)
    author: str = Field(index=True)
    author_id: Optional[int] = None
    html_url: Optional[str] = None
    comments_url: Optional[str] = None
    events_url: Optional[str] = None
    labels: Optional[List[str]] = Field(default=None, sa_column=Column(ARRAY(String)))
    assignees: Optional[List[str]] = Field(
        default=None, sa_column=Column(ARRAY(String))
    )
    milestone_id: Optional[int] = None
    milestone_title: Optional[str] = None
    comments: Optional[int] = 0
    locked: Optional[bool] = False
    active_lock_reason: Optional[str] = None
    closed_by: Optional[str] = None
    closed_by_id: Optional[int] = None
    reactions_total: Optional[int] = 0
    reactions_plus_one: Optional[int] = 0
    reactions_minus_one: Optional[int] = 0
    reactions_laugh: Optional[int] = 0
    reactions_hooray: Optional[int] = 0
    reactions_confused: Optional[int] = 0
    reactions_heart: Optional[int] = 0
    reactions_rocket: Optional[int] = 0
    reactions_eyes: Optional[int] = 0
    is_pull_request: Optional[bool] = False
    pull_request_url: Optional[str] = None
    type_name: Optional[str] = None
    created_at: Optional[datetime] = Field(default=None, index=True)
    updated_at: Optional[datetime] = Field(default=None, index=True)
    closed_at: Optional[datetime] = None
    last_event_action: Optional[str] = None
    last_event_sender: Optional[str] = None
    processed_at: Optional[datetime] = Field(default=None, index=True)
    workspace_id: int = Field(index=True)
