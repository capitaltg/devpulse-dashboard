from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Field, SQLModel


class PullRequest(SQLModel, table=True):
    __tablename__ = "pull_requests"

    id: int = Field(primary_key=True)
    number: int
    state: str = Field(index=True)
    title: str
    body: Optional[str] = None
    repository_id: int = Field(index=True)
    repository_full_name: str = Field(index=True)
    author: str = Field(index=True)
    author_id: Optional[int] = None
    head_ref: Optional[str] = None
    head_sha: Optional[str] = None
    base_ref: Optional[str] = None
    base_sha: Optional[str] = None
    created_at: Optional[datetime] = Field(default=None, index=True)
    updated_at: Optional[datetime] = Field(default=None, index=True)
    closed_at: Optional[datetime] = None
    merged_at: Optional[datetime] = None
    draft: Optional[bool] = False
    merged: Optional[bool] = Field(default=False, index=True)
    mergeable: Optional[bool] = None
    rebaseable: Optional[bool] = None
    mergeable_state: Optional[str] = None
    merged_by: Optional[str] = None
    merge_commit_sha: Optional[str] = None
    comments: Optional[int] = 0
    review_comments: Optional[int] = 0
    commits: Optional[int] = 0
    additions: Optional[int] = 0
    deletions: Optional[int] = 0
    changed_files: Optional[int] = 0
    labels: Optional[List[str]] = Field(default=None, sa_column=Column(ARRAY(String)))
    assignees: Optional[List[str]] = Field(
        default=None, sa_column=Column(ARRAY(String))
    )
    requested_reviewers: Optional[List[str]] = Field(
        default=None, sa_column=Column(ARRAY(String))
    )
    last_event_action: Optional[str] = None
    last_event_sender: Optional[str] = None
    processed_at: Optional[datetime] = Field(default=None, index=True)
    workspace_id: int = Field(index=True)
