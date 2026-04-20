"""Public configuration endpoint used by the frontend to bootstrap itself."""

from fastapi import APIRouter, HTTPException, status

from app.utils.auth import (
    AUTH_JWT_SECRET,
    AUTH_PROVIDER,
    GITHUB_OAUTH_CLIENT_ID,
    GITHUB_OAUTH_CLIENT_SECRET,
    OIDC_CLIENT_ID,
    OIDC_ISSUER,
    OIDC_SCOPE,
)

router = APIRouter(tags=["config"])


@router.get("/v1/config")
def get_client_config() -> dict:
    if AUTH_PROVIDER == "oidc":
        missing = [
            name
            for name, value in (
                ("OIDC_ISSUER", OIDC_ISSUER),
                ("OIDC_CLIENT_ID", OIDC_CLIENT_ID),
            )
            if not value
        ]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"OIDC not configured — set {', '.join(missing)}",
            )
        return {
            "provider": "oidc",
            "oidc": {
                "authority": OIDC_ISSUER,
                "client_id": OIDC_CLIENT_ID,
                "scope": OIDC_SCOPE,
            },
        }

    if AUTH_PROVIDER == "github":
        missing = [
            name
            for name, value in (
                ("GITHUB_OAUTH_CLIENT_ID", GITHUB_OAUTH_CLIENT_ID),
                ("GITHUB_OAUTH_CLIENT_SECRET", GITHUB_OAUTH_CLIENT_SECRET),
                ("AUTH_JWT_SECRET", AUTH_JWT_SECRET),
            )
            if not value
        ]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"GitHub OAuth not configured — set {', '.join(missing)}",
            )
        return {
            "provider": "github",
            "github": {"login_url": "/auth/github/login"},
        }

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="AUTH_PROVIDER must be set to 'github' or 'oidc'",
    )
