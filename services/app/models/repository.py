from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class RepositoryBase(SQLModel):
    """
    Shared fields present in both the database and API responses.
    """

    id: int = Field(primary_key=True)
    name: str
    full_name: str = Field(index=True)
    owner: str = Field(index=True)
    description: Optional[str] = None
    private: Optional[bool] = False
    html_url: Optional[str] = None
    default_branch: Optional[str] = "main"
    language: Optional[str] = None
    created_at: Optional[datetime] = Field(default=None, index=True)
    updated_at: Optional[datetime] = None
    pushed_at: Optional[datetime] = None
    stargazers_count: Optional[int] = 0
    watchers_count: Optional[int] = 0
    forks_count: Optional[int] = 0
    open_issues_count: Optional[int] = 0
    size: Optional[int] = 0
    has_issues: Optional[bool] = False
    has_projects: Optional[bool] = False
    has_wiki: Optional[bool] = False
    has_pages: Optional[bool] = False
    has_downloads: Optional[bool] = False
    archived: Optional[bool] = False
    disabled: Optional[bool] = False
    fork: Optional[bool] = False


class Repository(RepositoryBase, table=True):
    """
    The actual database table.
    Contains internal IDs and processing metadata.
    """

    __tablename__ = "repositories"

    workspace_id: int = Field(foreign_key="workspaces.id", index=True)
    last_event_action: Optional[str] = None
    last_event_sender: Optional[str] = None
    processed_at: Optional[datetime] = Field(default=None, index=True)


class RepositoryPublic(RepositoryBase):
    """
    The schema used for API responses (GET /repositories).
    Includes the 'computed' fields you want to return to the user.
    """

    # New computed fields
    recent_commit_count: int = 0
    recent_pr_count: int = 0
