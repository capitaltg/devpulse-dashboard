from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int = Field(primary_key=True)
    login: str = Field(index=True)
    node_id: Optional[str] = None
    type: Optional[str] = None
    site_admin: Optional[bool] = False
    name: Optional[str] = None
    email: Optional[str] = Field(default=None, index=True)
    company: Optional[str] = None
    blog: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    twitter_username: Optional[str] = None
    avatar_url: Optional[str] = None
    gravatar_id: Optional[str] = None
    public_repos: Optional[int] = 0
    public_gists: Optional[int] = 0
    followers: Optional[int] = 0
    following: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    hireable: Optional[bool] = None
    last_event_action: Optional[str] = None
    last_event_sender: Optional[str] = None
    import_source: Optional[str] = None
    processed_at: Optional[datetime] = None
