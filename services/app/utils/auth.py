import os
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

import requests
from cachetools import TTLCache, cached
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError, JWTClaimsError
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from app.db import get_session
from app.models import InternalUser

# Active auth provider: "github" or "oidc".
AUTH_PROVIDER = (os.getenv("AUTH_PROVIDER") or "").lower()

# OIDC settings (used when AUTH_PROVIDER == "oidc").
OIDC_ISSUER = (os.getenv("OIDC_ISSUER") or "").rstrip("/")
OIDC_CLIENT_ID = os.getenv("OIDC_CLIENT_ID") or ""
OIDC_SCOPE = os.getenv("OIDC_SCOPE") or "openid email profile"

# GitHub OAuth settings (used when AUTH_PROVIDER == "github").
GITHUB_OAUTH_CLIENT_ID = os.getenv("GITHUB_OAUTH_CLIENT_ID") or ""
GITHUB_OAUTH_CLIENT_SECRET = os.getenv("GITHUB_OAUTH_CLIENT_SECRET") or ""

# Shared settings for GitHub mode.
AUTH_JWT_SECRET = os.getenv("AUTH_JWT_SECRET") or ""
FRONTEND_BASE_URL = (os.getenv("FRONTEND_BASE_URL") or "").rstrip("/")

SESSION_JWT_ISSUER = "devpulse"
SESSION_JWT_AUDIENCE = "devpulse"
SESSION_JWT_TTL = timedelta(days=7)

_bearer_scheme = HTTPBearer()


@cached(TTLCache(maxsize=1, ttl=3600))
def _get_oidc_discovery() -> dict:
    return requests.get(
        f"{OIDC_ISSUER}/.well-known/openid-configuration", timeout=15
    ).json()


@cached(TTLCache(maxsize=1, ttl=3600))
def _get_jwks() -> dict:
    return requests.get(_get_oidc_discovery()["jwks_uri"], timeout=15).json()


def _authenticate_oidc(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            _get_jwks(),
            algorithms=["RS256"],
            audience=OIDC_CLIENT_ID,
            issuer=OIDC_ISSUER,
            options={"verify_at_hash": False},
        )
    except (ExpiredSignatureError, JWTError, JWTClaimsError) as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Unauthorized: {err}"
        )

    if not payload.get("email"):
        resp = requests.get(
            _get_oidc_discovery()["userinfo_endpoint"],
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        if resp.ok:
            userinfo = resp.json()
            for claim in ("email", "name", "preferred_username"):
                if claim in userinfo and claim not in payload:
                    payload[claim] = userinfo[claim]

    return payload


def _authenticate_github_session(token: str) -> dict:
    if not AUTH_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AUTH_JWT_SECRET is not configured",
        )
    try:
        return jwt.decode(
            token,
            AUTH_JWT_SECRET,
            algorithms=["HS256"],
            audience=SESSION_JWT_AUDIENCE,
            issuer=SESSION_JWT_ISSUER,
        )
    except (ExpiredSignatureError, JWTError, JWTClaimsError) as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Unauthorized: {err}"
        )


def authenticate_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> dict:
    token = credentials.credentials
    if AUTH_PROVIDER == "github":
        return _authenticate_github_session(token)
    if AUTH_PROVIDER == "oidc":
        return _authenticate_oidc(token)
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=f"AUTH_PROVIDER is not set to a supported value (got {AUTH_PROVIDER!r})",
    )


def issue_session_token(
    *, sub: UUID, email: str, username: str, name: Optional[str]
) -> str:
    if not AUTH_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AUTH_JWT_SECRET is not configured",
        )
    now = datetime.utcnow()
    payload = {
        "sub": str(sub),
        "email": email,
        "preferred_username": username,
        "name": name,
        "iss": SESSION_JWT_ISSUER,
        "aud": SESSION_JWT_AUDIENCE,
        "iat": int(now.timestamp()),
        "exp": int((now + SESSION_JWT_TTL).timestamp()),
    }
    return jwt.encode(payload, AUTH_JWT_SECRET, algorithm="HS256")


user_cache = TTLCache(maxsize=1000, ttl=300)


async def get_current_user(token: dict = Depends(authenticate_user)) -> InternalUser:
    """
    Dependency to get the current authenticated user.

    Usage in route handlers:
        @router.get("/me")
        async def get_me(user: InternalUser = Depends(get_current_user)):
            return {"username": user.username}
    """
    if not token or not token.get("email"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    cache_key = token["email"]
    if cache_key in user_cache:
        return user_cache[cache_key]

    user = get_or_create_user_by_auth(
        email=token.get("email"),
        username=token.get("preferred_username") or token["sub"],
        name=token.get("name"),
        sub=token["sub"],
    )
    user_cache[cache_key] = user
    return user


def get_or_create_user_by_auth(
    email: Optional[str], username: str, name: Optional[str], sub: str
) -> InternalUser:
    resolved_email = email
    now = datetime.utcnow()
    subject_id = UUID(sub)

    with get_session() as session:
        user = session.exec(
            select(InternalUser).where(InternalUser.email == resolved_email)
        ).first()

        if user is not None:
            try:
                user.sub = subject_id
                if "@" not in username:
                    user.username = username
                user.display_name = user.display_name or name
                user.last_login_at = now
                user.updated_at = now
                session.commit()
                session.refresh(user)
            except Exception:
                session.rollback()
                session.refresh(user)
            return user

        try:
            new_user = InternalUser(
                sub=subject_id,
                username=username,
                email=resolved_email,
                display_name=name,
                last_login_at=now,
                updated_at=now,
                created_at=now,
            )
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            return new_user
        except IntegrityError:
            session.rollback()
            raise
