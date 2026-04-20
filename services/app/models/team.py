from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Team(SQLModel, table=True):
    __tablename__ = "teams"

    id: int = Field(primary_key=True)
    node_id: Optional[str] = None
    name: str
    slug: str = Field(index=True)
    description: Optional[str] = None
    organization_id: int = Field(index=True)
    privacy: Optional[str] = None
    notification_setting: Optional[str] = None
    permission: Optional[str] = None
    url: Optional[str] = None
    html_url: Optional[str] = None
    members_url: Optional[str] = None
    repositories_url: Optional[str] = None
    parent_id: Optional[int] = Field(default=None, foreign_key="teams.id", index=True)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_event_action: Optional[str] = None
    last_event_at: Optional[datetime] = None
    synced_at: Optional[datetime] = Field(default=None, index=True)
    workspace_id: int = Field(foreign_key="workspaces.id", index=True)
