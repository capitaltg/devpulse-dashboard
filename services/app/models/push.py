from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Field, SQLModel


class Push(SQLModel, table=True):
    __tablename__ = "pushes"

    id: Optional[int] = Field(default=None, primary_key=True)
    push_id: Optional[str] = None
    ref: str
    before_sha: str
    after_sha: str
    repository_id: int
    repository_full_name: str
    pusher: str
    pusher_email: Optional[str] = None
    sender: Optional[str] = None
    sender_id: Optional[int] = None
    branch_name: Optional[str] = None
    is_default_branch: Optional[bool] = False
    created: Optional[bool] = False
    deleted: Optional[bool] = False
    forced: Optional[bool] = False
    commit_count: Optional[int] = 0
    distinct_commit_count: Optional[int] = 0
    head_commit_id: Optional[str] = None
    head_commit_message: Optional[str] = None
    head_commit_timestamp: Optional[datetime] = None
    head_commit_author: Optional[str] = None
    head_commit_author_email: Optional[str] = None
    head_commit_committer: Optional[str] = None
    head_commit_committer_email: Optional[str] = None
    head_commit_url: Optional[str] = None
    commit_ids: Optional[List[str]] = Field(
        default=None, sa_column=Column(ARRAY(String))
    )
    commit_messages: Optional[List[str]] = Field(
        default=None, sa_column=Column(ARRAY(String))
    )
    compare_url: Optional[str] = None
    pushed_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    workspace_id: int = Field(index=True)
