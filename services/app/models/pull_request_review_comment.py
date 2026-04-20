from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class PullRequestReviewComment(SQLModel, table=True):
    __tablename__ = "pull_request_review_comments"

    id: int = Field(primary_key=True)
    pull_request_id: int = Field(index=True)
    pull_request_number: int = Field(index=True)
    pull_request_review_id: Optional[int] = Field(default=None, index=True)
    repository_id: int = Field(index=True)
    repository_full_name: str = Field(index=True)
    author: str = Field(index=True)
    author_id: Optional[int] = None
    body: str
    path: Optional[str] = Field(default=None, index=True)
    position: Optional[int] = None
    original_position: Optional[int] = None
    line: Optional[int] = None
    original_line: Optional[int] = None
    side: Optional[str] = None
    start_line: Optional[int] = None
    start_side: Optional[str] = None
    commit_id: Optional[str] = Field(default=None, index=True)
    original_commit_id: Optional[str] = None
    diff_hunk: Optional[str] = None
    in_reply_to_id: Optional[int] = Field(default=None, index=True)
    html_url: Optional[str] = None
    pull_request_url: Optional[str] = None
    created_at: Optional[datetime] = Field(default=None, index=True)
    updated_at: Optional[datetime] = Field(default=None, index=True)
    last_event_action: Optional[str] = None
    last_event_sender: Optional[str] = None
    processed_at: Optional[datetime] = Field(default=None, index=True)
    workspace_id: int = Field(index=True)
