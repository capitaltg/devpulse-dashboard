from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class CommitComment(SQLModel, table=True):
    __tablename__ = "commit_comments"

    id: int = Field(primary_key=True)
    commit_id: str = Field(index=True)
    repository_id: int
    repository_full_name: str
    author: str = Field(index=True)
    author_id: Optional[int] = None
    body: str
    path: Optional[str] = Field(default=None, index=True)
    position: Optional[int] = None
    line: Optional[int] = None
    html_url: Optional[str] = None
    commit_url: Optional[str] = None
    created_at: Optional[datetime] = Field(default=None, index=True)
    updated_at: Optional[datetime] = None
    reactions_total: Optional[int] = 0
    reactions_plus_one: Optional[int] = 0
    reactions_minus_one: Optional[int] = 0
    reactions_laugh: Optional[int] = 0
    reactions_hooray: Optional[int] = 0
    reactions_confused: Optional[int] = 0
    reactions_heart: Optional[int] = 0
    reactions_rocket: Optional[int] = 0
    reactions_eyes: Optional[int] = 0
    last_event_action: Optional[str] = None
    last_event_sender: Optional[str] = None
    processed_at: Optional[datetime] = Field(default=None, index=True)
    workspace_id: int = Field(index=True)
