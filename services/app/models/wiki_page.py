from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class WikiPage(SQLModel, table=True):
    __tablename__ = "wiki_pages"

    id: Optional[int] = Field(default=None, primary_key=True)
    repository_id: int = Field(index=True)
    repository_full_name: str
    page_name: str
    title: Optional[str] = None
    action: str
    sha: str
    html_url: Optional[str] = None
    sender: Optional[str] = None
    sender_id: Optional[int] = None
    created_at: Optional[datetime] = Field(default=None, index=True)
    processed_at: Optional[datetime] = Field(default=None, index=True)
    workspace_id: int
