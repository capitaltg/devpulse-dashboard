from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Commit(SQLModel, table=True):
    __tablename__ = "commits"

    sha: str = Field(primary_key=True)
    repository_id: Optional[int] = Field(
        default=None, foreign_key="repositories.id", index=True
    )
    repository_owner: str = Field(index=True)
    repository_name: str = Field(index=True)
    repository_full_name: str = Field(index=True)
    message: str
    author_date: Optional[datetime] = Field(default=None, index=True)
    author_email: Optional[str] = None
    committer_date: Optional[datetime] = Field(default=None, index=True)
    committer_email: Optional[str] = None
    author_login: Optional[str] = Field(default=None, index=True)
    author_id: Optional[int] = None
    committer_login: Optional[str] = Field(default=None, index=True)
    committer_id: Optional[int] = None
    comment_count: Optional[int] = 0
    total_changes: Optional[int] = None
    additions: Optional[int] = None
    deletions: Optional[int] = None
    verified: Optional[bool] = False
    verification_reason: Optional[str] = None
    verified_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    commit_type: str = Field(index=True)
