from datetime import datetime
from typing import Optional

from sqlmodel import select

from app.db import get_session
from app.models import Organization
from app.models.external_user import User
from app.models.organization import OrganizationMember, OrganizationToken
from app.models.team import Team
from app.models.team_member import TeamMember
from app.utils.encryption import decrypt_token, encrypt_token
from app.utils.github_utils import github_api_request


def query_organizations(workspace_id: int) -> list[dict[str, object]]:
    """Return all organizations for a given workspace."""
    with get_session() as session:
        orgs = session.exec(
            select(Organization)
            .where(Organization.workspace_id == workspace_id)
            .order_by(Organization.login.asc())
        ).all()

        # Collect org IDs that have at least one active token (avoids duplicate rows
        # from the join when multiple active tokens exist for the same org).
        orgs_with_token = set(
            session.exec(
                select(OrganizationToken.organization_id)
                .where(OrganizationToken.workspace_id == workspace_id)
                .where(OrganizationToken.is_active == True)
            ).all()
        )

        return [
            {
                **org.model_dump(),
                "has_active_token": org.id in orgs_with_token,
            }
            for org in orgs
        ]


def query_organization_members(workspace_id: int, organization: str) -> list[User]:
    """Return all users that are members of the given organization within a workspace."""
    with get_session() as session:
        users = session.exec(
            select(User)
            .join(OrganizationMember, OrganizationMember.user_id == User.id)
            .join(
                Organization,
                (Organization.workspace_id == OrganizationMember.workspace_id)
                & (Organization.id == OrganizationMember.organization_id),
            )
            .where(Organization.workspace_id == workspace_id)
            .where(Organization.login == organization)
            .order_by(User.login.asc())
        ).all()
        return users


def get_workspace_member_by_login(workspace_id: int, login: str) -> Optional[User]:
    """Return a single workspace member by their GitHub login."""
    with get_session() as session:
        return session.exec(
            select(User)
            .join(OrganizationMember, OrganizationMember.user_id == User.id)
            .where(OrganizationMember.workspace_id == workspace_id)
            .where(User.login == login)
        ).first()


def query_organization_teams(
    workspace_id: int,
    organization: str,
    limit: int,
    page: int,
    slug: Optional[str] = None,
) -> list[Team]:
    """Return all teams for a given organization within a workspace."""
    statement = (
        select(Team)
        .join(
            Organization,
            (Organization.workspace_id == Team.workspace_id)
            & (Organization.id == Team.organization_id),
        )
        .where(Organization.workspace_id == workspace_id)
        .where(Organization.login == organization)
        .order_by(Team.name.asc())
        .offset((page - 1) * limit)
        .limit(limit)
    )

    if slug:
        statement = statement.where(Team.slug == slug)

    with get_session() as session:
        teams = session.exec(statement).all()
        return teams


def query_team_members(workspace_id: int, organization: str, team: str) -> list[User]:
    """Return all users that are members of the given team within an organization and workspace."""
    with get_session() as session:
        users = session.exec(
            select(User)
            .join(TeamMember, TeamMember.user_id == User.id)
            .join(
                Team,
                (Team.workspace_id == TeamMember.workspace_id)
                & (Team.id == TeamMember.team_id),
            )
            .join(
                Organization,
                (Organization.workspace_id == Team.workspace_id)
                & (Organization.id == Team.organization_id),
            )
            .where(Organization.workspace_id == workspace_id)
            .where(Organization.login == organization)
            .where(Team.slug == team)
            .order_by(User.login.asc())
        ).all()
        return users


def get_organization_token(workspace_id: int, organization_login: str) -> Optional[str]:
    """Return the active GitHub PAT for the given organization, or None if not configured."""
    with get_session() as session:
        token = session.exec(
            select(OrganizationToken.token)
            .join(Organization, Organization.id == OrganizationToken.organization_id)
            .where(Organization.workspace_id == workspace_id)
            .where(Organization.login == organization_login)
            .where(OrganizationToken.workspace_id == workspace_id)
            .where(OrganizationToken.is_active == True)
            .order_by(OrganizationToken.created_at.desc())
        ).first()
        descrypted_token = decrypt_token(token) if token else None
        return descrypted_token


def create_organization_token(
    workspace_id: int,
    organization_id: int,
    github_pat: str,
    created_by: int,
    description: Optional[str] = None,
) -> None:
    encrypted_token = encrypt_token(github_pat)
    """Create a new organization token for the given organization and workspace."""
    with get_session() as session:
        new_token = OrganizationToken(
            workspace_id=workspace_id,
            organization_id=organization_id,
            token=encrypted_token,
            description=description or "",
            created_at=datetime.utcnow(),
            created_by=created_by,
        )
        session.add(new_token)
        session.commit()
        session.refresh(new_token)


def get_organization_by_login(workspace_id: int, login: str) -> Optional[dict]:
    """Return a single organization with token status, or None if not found."""
    with get_session() as session:
        row = session.exec(
            select(Organization, OrganizationToken.id)
            .outerjoin(
                OrganizationToken,
                (OrganizationToken.workspace_id == Organization.workspace_id)
                & (OrganizationToken.organization_id == Organization.id)
                & (OrganizationToken.is_active == True),
            )
            .where(Organization.workspace_id == workspace_id)
            .where(Organization.login == login)
        ).first()
        if not row:
            return None
        org, token_id = row
        return {**org.model_dump(), "has_active_token": token_id is not None}


def get_org_tokens(workspace_id: int, org_login: str) -> list[dict]:
    """Return all active tokens for the given organization within a workspace."""
    with get_session() as session:
        rows = session.exec(
            select(OrganizationToken)
            .join(Organization, Organization.id == OrganizationToken.organization_id)
            .where(Organization.workspace_id == workspace_id)
            .where(Organization.login == org_login)
            .where(OrganizationToken.workspace_id == workspace_id)
            .where(OrganizationToken.is_active == True)
            .order_by(OrganizationToken.created_at.desc())
        ).all()
        return [t.model_dump(exclude={"token"}) for t in rows]


def revoke_organization_token(workspace_id: int, token_id: int) -> bool:
    """Revoke an organization token by marking it inactive. Returns False if not found or already revoked."""
    with get_session() as session:
        token = session.exec(
            select(OrganizationToken).where(
                OrganizationToken.id == token_id,
                OrganizationToken.workspace_id == workspace_id,
                OrganizationToken.is_active == True,
            )
        ).first()
        if not token:
            return False
        token.is_active = False
        session.add(token)
        session.commit()
        return True


def remove_organization(workspace_id: int, login: str) -> bool:
    """
    Remove an organization from a workspace.

    Deletes the Organization record and all associated OrganizationToken and
    OrganizationMember rows scoped to this workspace. Returns False if the
    organization was not found.
    """
    with get_session() as session:
        org = session.exec(
            select(Organization).where(
                Organization.workspace_id == workspace_id,
                Organization.login == login,
            )
        ).first()

        if not org:
            return False

        # Remove tokens scoped to this workspace + org
        tokens = session.exec(
            select(OrganizationToken).where(
                OrganizationToken.workspace_id == workspace_id,
                OrganizationToken.organization_id == org.id,
            )
        ).all()
        for token in tokens:
            session.delete(token)

        # Remove membership records scoped to this workspace + org
        members = session.exec(
            select(OrganizationMember).where(
                OrganizationMember.workspace_id == workspace_id,
                OrganizationMember.organization_id == org.id,
            )
        ).all()
        for member in members:
            session.delete(member)

        session.delete(org)
        session.commit()

    return True


def upsert_github_user(login: str, token: Optional[str] = None) -> None:
    """Insert a User record from GitHub if one doesn't already exist in the database."""
    with get_session() as session:
        existing = session.exec(select(User).where(User.login == login)).first()
        if existing:
            return

    user_data = github_api_request("GET", f"/users/{login}", token=token)
    if not user_data:
        return

    now = datetime.utcnow()
    with get_session() as session:
        new_user = User(
            id=user_data["id"],
            login=user_data["login"],
            node_id=user_data.get("node_id"),
            type=user_data.get("type"),
            site_admin=user_data.get("site_admin", False),
            name=user_data.get("name"),
            email=user_data.get("email"),
            company=user_data.get("company"),
            blog=user_data.get("blog"),
            location=user_data.get("location"),
            bio=user_data.get("bio"),
            twitter_username=user_data.get("twitter_username"),
            avatar_url=user_data.get("avatar_url"),
            gravatar_id=user_data.get("gravatar_id"),
            public_repos=user_data.get("public_repos", 0),
            public_gists=user_data.get("public_gists", 0),
            followers=user_data.get("followers", 0),
            following=user_data.get("following", 0),
            hireable=user_data.get("hireable"),
            created_at=_parse_gh_dt(user_data.get("created_at")),
            updated_at=_parse_gh_dt(user_data.get("updated_at")),
            import_source="dashboard_login",
            processed_at=now,
        )
        session.add(new_user)
        session.commit()


def _parse_gh_dt(value: Optional[str]) -> Optional[datetime]:
    """Parse a GitHub ISO-8601 datetime string into a naive UTC datetime."""
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ")


def add_organization(
    workspace_id: int,
    login: str,
    api_key: str,
    created_by: int,
    description: Optional[str] = None,
) -> Organization:
    """
    Fetch organization metadata from GitHub, upsert the Organization record for
    the given workspace, and store the supplied API key as an OrganizationToken.

    Args:
        workspace_id: Internal workspace ID
        login: GitHub organization handle (e.g. "my-org")
        api_key: GitHub Personal Access Token with org read scope
        created_by: Internal user ID of the requester

    Returns:
        The upserted Organization record.

    Raises:
        requests.exceptions.HTTPError: if the GitHub API returns a non-2xx response.
    """
    org_data = github_api_request("GET", f"/orgs/{login}", token=api_key)

    org_id: int = org_data["id"]

    with get_session() as session:
        existing = session.exec(
            select(Organization).where(
                Organization.workspace_id == workspace_id,
                Organization.id == org_id,
            )
        ).first()

        if existing:
            existing.login = org_data.get("login", existing.login)
            existing.node_id = org_data.get("node_id", existing.node_id)
            existing.name = org_data.get("name", existing.name)
            existing.description = org_data.get("description", existing.description)
            existing.type = org_data.get("type", existing.type)
            existing.company = org_data.get("company", existing.company)
            existing.blog = org_data.get("blog", existing.blog)
            existing.location = org_data.get("location", existing.location)
            existing.email = org_data.get("email", existing.email)
            existing.twitter_username = org_data.get(
                "twitter_username", existing.twitter_username
            )
            existing.is_verified = org_data.get("is_verified", existing.is_verified)
            existing.avatar_url = org_data.get("avatar_url", existing.avatar_url)
            existing.url = org_data.get("url", existing.url)
            existing.html_url = org_data.get("html_url", existing.html_url)
            existing.repos_url = org_data.get("repos_url", existing.repos_url)
            existing.events_url = org_data.get("events_url", existing.events_url)
            existing.hooks_url = org_data.get("hooks_url", existing.hooks_url)
            existing.issues_url = org_data.get("issues_url", existing.issues_url)
            existing.members_url = org_data.get("members_url", existing.members_url)
            existing.public_members_url = org_data.get(
                "public_members_url", existing.public_members_url
            )
            existing.has_organization_projects = org_data.get(
                "has_organization_projects", existing.has_organization_projects
            )
            existing.has_repository_projects = org_data.get(
                "has_repository_projects", existing.has_repository_projects
            )
            existing.public_repos = org_data.get("public_repos", existing.public_repos)
            existing.public_gists = org_data.get("public_gists", existing.public_gists)
            existing.followers = org_data.get("followers", existing.followers)
            existing.following = org_data.get("following", existing.following)
            existing.updated_at = (
                _parse_gh_dt(org_data.get("updated_at")) or existing.updated_at
            )
            session.add(existing)
            session.commit()
            session.refresh(existing)
            org = existing
        else:
            org = Organization(
                workspace_id=workspace_id,
                id=org_id,
                login=org_data["login"],
                node_id=org_data.get("node_id"),
                name=org_data.get("name"),
                description=org_data.get("description"),
                type=org_data.get("type"),
                company=org_data.get("company"),
                blog=org_data.get("blog"),
                location=org_data.get("location"),
                email=org_data.get("email"),
                twitter_username=org_data.get("twitter_username"),
                is_verified=org_data.get("is_verified", False),
                avatar_url=org_data.get("avatar_url"),
                url=org_data.get("url"),
                html_url=org_data.get("html_url"),
                repos_url=org_data.get("repos_url"),
                events_url=org_data.get("events_url"),
                hooks_url=org_data.get("hooks_url"),
                issues_url=org_data.get("issues_url"),
                members_url=org_data.get("members_url"),
                public_members_url=org_data.get("public_members_url"),
                has_organization_projects=org_data.get(
                    "has_organization_projects", True
                ),
                has_repository_projects=org_data.get("has_repository_projects", True),
                public_repos=org_data.get("public_repos", 0),
                public_gists=org_data.get("public_gists", 0),
                followers=org_data.get("followers", 0),
                following=org_data.get("following", 0),
                created_at=_parse_gh_dt(org_data.get("created_at")),
                updated_at=_parse_gh_dt(org_data.get("updated_at")),
                archived_at=_parse_gh_dt(org_data.get("archived_at")),
            )
            session.add(org)
            session.commit()
            session.refresh(org)

    create_organization_token(
        workspace_id=workspace_id,
        organization_id=org_id,
        github_pat=api_key,
        created_by=created_by,
        description=description or "Added via dashboard",
    )

    return org
