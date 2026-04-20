from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlmodel import Field, SQLModel


class InternalUser(SQLModel, table=True):
    __tablename__ = "internal_users"

    id: int = Field(primary_key=True)
    sub: UUID = Field(unique=True, index=True)
    username: str
    email: str
    display_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_admin: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
