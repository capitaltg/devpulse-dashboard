"""GitHub OAuth login flow.

Flow:
  1. Frontend redirects browser to GET /auth/github/login.
  2. Backend redirects to GitHub with a random state, stored in an
     HTTP-only cookie for CSRF verification on return.
  3. GitHub calls back with ?code=...&state=... at /auth/github/callback.
  4. Backend exchanges code for access_token, fetches /user (+ /user/emails
     if needed), upserts an InternalUser, signs a session JWT, and redirects
     the browser to the frontend callback with the JWT in a URL fragment.
"""

import logging
import secrets
from datetime import datetime
from typing import Optional
from uuid import uuid4

import requests
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlmodel import select

from app.db import get_session
from app.models import InternalUser
from app.utils.auth import (
    AUTH_PROVIDER,
    FRONTEND_BASE_URL,
    GITHUB_OAUTH_CLIENT_ID,
    GITHUB_OAUTH_CLIENT_SECRET,
    issue_session_token,
)

router = APIRouter(tags=["auth"])
logger = logging.getLogger(__name__)

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_USER_EMAILS_URL = "https://api.github.com/user/emails"

STATE_COOKIE = "devpulse_oauth_state"
STATE_TTL_SECONDS = 600


def _require_github_enabled() -> None:
    if AUTH_PROVIDER != "github":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GitHub OAuth is not enabled on this deployment",
        )


def _require_github_configured() -> None:
    missing = [
        name
        for name, value in (
            ("GITHUB_OAUTH_CLIENT_ID", GITHUB_OAUTH_CLIENT_ID),
            ("GITHUB_OAUTH_CLIENT_SECRET", GITHUB_OAUTH_CLIENT_SECRET),
        )
        if not value
    ]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"GitHub OAuth not configured — set {', '.join(missing)}",
        )


def _frontend_base(request: Request) -> str:
    if FRONTEND_BASE_URL:
        return FRONTEND_BASE_URL
    return str(request.base_url).rstrip("/")


@router.get("/auth/github/login")
def github_login() -> RedirectResponse:
    _require_github_enabled()
    _require_github_configured()

    state = secrets.token_urlsafe(32)
    url = (
        f"{GITHUB_AUTHORIZE_URL}"
        f"?client_id={GITHUB_OAUTH_CLIENT_ID}"
        f"&scope=read:user%20user:email"
        f"&state={state}"
    )
    response = RedirectResponse(url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
    response.set_cookie(
        STATE_COOKIE,
        state,
        max_age=STATE_TTL_SECONDS,
        httponly=True,
        samesite="lax",
    )
    return response


@router.get("/auth/github/callback")
def github_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
) -> RedirectResponse:
    _require_github_enabled()
    _require_github_configured()

    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"GitHub returned an error: {error}",
        )
    if not code or not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing code or state",
        )

    cookie_state = request.cookies.get(STATE_COOKIE)
    if not cookie_state or cookie_state != state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state — login expired or was tampered with",
        )

    token_resp = requests.post(
        GITHUB_TOKEN_URL,
        data={
            "client_id": GITHUB_OAUTH_CLIENT_ID,
            "client_secret": GITHUB_OAUTH_CLIENT_SECRET,
            "code": code,
        },
        headers={"Accept": "application/json"},
        timeout=15,
    )
    if not token_resp.ok:
        logger.warning(
            "GitHub token exchange failed: %s %s",
            token_resp.status_code,
            token_resp.text,
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="GitHub token exchange failed",
        )
    access_token = token_resp.json().get("access_token")
    if not access_token:
        logger.warning(
            "GitHub token exchange returned no access_token: %s", token_resp.json()
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="GitHub did not return an access token",
        )

    gh_headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
    }
    user_resp = requests.get(GITHUB_USER_URL, headers=gh_headers, timeout=15)
    if not user_resp.ok:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch GitHub user profile",
        )
    gh_user = user_resp.json()
    gh_login: str = gh_user.get("login") or ""
    gh_name: Optional[str] = gh_user.get("name")
    email: Optional[str] = gh_user.get("email")

    if not email:
        emails_resp = requests.get(
            GITHUB_USER_EMAILS_URL, headers=gh_headers, timeout=15
        )
        if emails_resp.ok:
            primary = next(
                (
                    e
                    for e in emails_resp.json()
                    if e.get("primary") and e.get("verified")
                ),
                None,
            )
            if primary:
                email = primary.get("email")

    if not email or not gh_login:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Could not determine your verified primary email from GitHub. "
                "Make sure a primary verified email is set in your GitHub account."
            ),
        )

    now = datetime.utcnow()
    with get_session() as session:
        user = session.exec(
            select(InternalUser).where(InternalUser.email == email)
        ).first()
        if user is None:
            user = InternalUser(
                sub=uuid4(),
                username=gh_login,
                email=email,
                display_name=gh_name,
                last_login_at=now,
                updated_at=now,
                created_at=now,
            )
            session.add(user)
        else:
            user.last_login_at = now
            user.updated_at = now
            if not user.display_name:
                user.display_name = gh_name
        session.commit()
        session.refresh(user)

    session_jwt = issue_session_token(
        sub=user.sub,
        email=email,
        username=gh_login,
        name=gh_name,
    )

    redirect_url = f"{_frontend_base(request)}/callback#token={session_jwt}"
    response = RedirectResponse(
        redirect_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT
    )
    response.delete_cookie(STATE_COOKIE)
    return response
