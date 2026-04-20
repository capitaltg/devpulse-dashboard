from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class IssueComment(SQLModel, table=True):
    __tablename__ = "issue_comments"

    id: int = Field(primary_key=True)
    issue_id: int = Field(index=True)
    issue_number: int = Field(index=True)
    repository_id: int = Field(index=True)
    repository_full_name: str = Field(index=True)
    author: str = Field(index=True)
    author_id: Optional[int] = None
    body: str
    html_url: Optional[str] = None
    issue_url: Optional[str] = None
    created_at: Optional[datetime] = Field(default=None, index=True)
    updated_at: Optional[datetime] = Field(default=None, index=True)
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
