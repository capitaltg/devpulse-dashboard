from datetime import datetime, timezone
from typing import Optional

from sqlmodel import select

from app.db import get_session
from app.models.external_user import User


def _parse_gh_dt(value: Optional[str]) -> Optional[datetime]:
    """Parse a GitHub ISO-8601 datetime string to a timezone-aware datetime."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def get_external_user_by_login(login: str) -> User | None:
    """Look up a GitHub user in the local `users` table by login."""
    with get_session() as session:
        return session.exec(select(User).where(User.login == login)).first()


def upsert_external_user(github_data: dict) -> User:
    """
    Insert or update a GitHub user in the `users` table from a GitHub API response.
    Uses the GitHub numeric user ID as the primary key.
    """
    with get_session() as session:
        user = session.exec(select(User).where(User.id == github_data["id"])).first()

        fields = {
            "login": github_data.get("login"),
            "node_id": github_data.get("node_id"),
            "type": github_data.get("type"),
            "site_admin": github_data.get("site_admin", False),
            "name": github_data.get("name"),
            "email": github_data.get("email"),
            "company": github_data.get("company"),
            "blog": github_data.get("blog"),
            "location": github_data.get("location"),
            "bio": github_data.get("bio"),
            "twitter_username": github_data.get("twitter_username"),
            "avatar_url": github_data.get("avatar_url"),
            "gravatar_id": github_data.get("gravatar_id"),
            "public_repos": github_data.get("public_repos", 0),
            "public_gists": github_data.get("public_gists", 0),
            "followers": github_data.get("followers", 0),
            "following": github_data.get("following", 0),
            "hireable": github_data.get("hireable"),
            "created_at": _parse_gh_dt(github_data.get("created_at")),
            "updated_at": _parse_gh_dt(github_data.get("updated_at")),
            "import_source": "github_api",
            "processed_at": datetime.now(timezone.utc),
        }

        if user is None:
            user = User(id=github_data["id"], **fields)
            session.add(user)
        else:
            for key, value in fields.items():
                setattr(user, key, value)
            session.add(user)

        session.commit()
        session.refresh(user)
        return user
