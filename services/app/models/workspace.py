from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class WorkspaceMember(SQLModel, table=True):
    __tablename__ = "workspace_members"

    workspace_id: int = Field(foreign_key="workspaces.id", primary_key=True)
    user_id: int = Field(foreign_key="internal_users.id", primary_key=True)
    relationship: str
    added_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class Workspace(SQLModel, table=True):
    __tablename__ = "workspaces"

    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: str = Field(index=True, unique=True)
    description: Optional[str] = None
    creator_id: int = Field(foreign_key="internal_users.id", index=True)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class WorkspaceToken(SQLModel, table=True):
    __tablename__ = "workspace_tokens"

    id: int = Field(default=None, primary_key=True)
    workspace_id: int = Field(foreign_key="workspaces.id", index=True)
    token: str = Field(sa_column_kwargs={"name": "secret"})
    description: str
    created_at: datetime
    created_by: int = Field(foreign_key="internal_users.id")
    last_used_at: Optional[datetime] = None
    is_active: Optional[bool] = True
    revoked_at: Optional[datetime] = None
    revoked_by: Optional[int] = Field(default=None, foreign_key="internal_users.id")
