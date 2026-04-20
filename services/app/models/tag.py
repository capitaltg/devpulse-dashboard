from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Tag(SQLModel, table=True):
    __tablename__ = "tags"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    repository_id: int = Field(index=True)
    repository_full_name: str = Field(index=True)
    status: str = Field(default="active", index=True)
    commit_sha: Optional[str] = None
    description: Optional[str] = None
    created_at: Optional[datetime] = Field(default=None, index=True)
    created_by: Optional[str] = Field(default=None, index=True)
    created_by_email: Optional[str] = None
    created_by_id: Optional[int] = None
    deleted_at: Optional[datetime] = Field(default=None, index=True)
    deleted_by: Optional[str] = Field(default=None, index=True)
    deleted_by_email: Optional[str] = None
    deleted_by_id: Optional[int] = None
    updated_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    workspace_id: int
