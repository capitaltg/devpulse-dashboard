from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class PullRequestReview(SQLModel, table=True):
    __tablename__ = "pull_request_reviews"

    id: int = Field(primary_key=True)
    pull_request_id: int = Field(index=True)
    pull_request_number: int = Field(index=True)
    repository_id: int = Field(index=True)
    repository_full_name: str = Field(index=True)
    reviewer: str = Field(index=True)
    reviewer_id: Optional[int] = None
    state: str = Field(index=True)
    body: Optional[str] = None
    html_url: Optional[str] = None
    pull_request_url: Optional[str] = None
    commit_id: Optional[str] = None
    submitted_at: Optional[datetime] = Field(default=None, index=True)
    last_event_action: Optional[str] = None
    last_event_sender: Optional[str] = None
    processed_at: Optional[datetime] = Field(default=None, index=True)
    workspace_id: int = Field(index=True)
