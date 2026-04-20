from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Organization(SQLModel, table=True):
    __tablename__ = "organizations"

    workspace_id: int = Field(primary_key=True, foreign_key="workspaces.id")
    id: int = Field(primary_key=True)
    login: str
    node_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    company: Optional[str] = None
    blog: Optional[str] = None
    location: Optional[str] = None
    email: Optional[str] = None
    twitter_username: Optional[str] = None
    is_verified: Optional[bool] = False
    avatar_url: Optional[str] = None
    url: Optional[str] = None
    html_url: Optional[str] = None
    repos_url: Optional[str] = None
    events_url: Optional[str] = None
    hooks_url: Optional[str] = None
    issues_url: Optional[str] = None
    members_url: Optional[str] = None
    public_members_url: Optional[str] = None
    has_organization_projects: Optional[bool] = True
    has_repository_projects: Optional[bool] = True
    public_repos: Optional[int] = 0
    public_gists: Optional[int] = 0
    followers: Optional[int] = 0
    following: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None
    last_event_action: Optional[str] = None
    last_event_sender: Optional[str] = None
    processed_at: Optional[datetime] = None


class OrganizationMember(SQLModel, table=True):
    __tablename__ = "organization_members"

    organization_id: int = Field(primary_key=True)
    user_id: int = Field(primary_key=True, foreign_key="users.id")
    synced_at: Optional[datetime] = None
    workspace_id: int = Field(foreign_key="workspaces.id")


class OrganizationToken(SQLModel, table=True):
    __tablename__ = "organization_tokens"

    id: int = Field(default=None, primary_key=True)
    workspace_id: int = Field(foreign_key="workspaces.id", index=True)
    organization_id: int = Field(foreign_key="organizations.id", index=True)
    token: str = Field(sa_column_kwargs={"name": "github_pat"})
    description: str
    created_at: datetime
    created_by: int = Field(foreign_key="internal_users.id")
    last_used_at: Optional[datetime] = None
    is_active: Optional[bool] = True
