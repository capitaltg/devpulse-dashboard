from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class TeamMember(SQLModel, table=True):
    __tablename__ = "team_members"

    workspace_id: int = Field(primary_key=True, foreign_key="workspaces.id")
    team_id: int = Field(primary_key=True)
    user_id: int = Field(primary_key=True, foreign_key="users.id")
    role: Optional[str] = None
    synced_at: Optional[datetime] = None
