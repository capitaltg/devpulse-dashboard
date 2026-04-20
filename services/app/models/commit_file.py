from typing import Optional

from sqlmodel import Field, SQLModel


class CommitFile(SQLModel, table=True):
    __tablename__ = "commit_files"

    id: Optional[int] = Field(default=None, primary_key=True)
    commit_sha: str = Field(foreign_key="commits.sha", index=True)
    filename: str = Field(index=True)
    previous_filename: Optional[str] = None
    status: str = Field(index=True)
    additions: Optional[int] = 0
    deletions: Optional[int] = 0
    changes: Optional[int] = 0
    sha: Optional[str] = None
    patch: Optional[str] = None
