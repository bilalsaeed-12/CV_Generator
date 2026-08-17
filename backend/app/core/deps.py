"""
Request dependencies.

`CurrentUser` is the important one. Any route that declares it becomes
protected — FastAPI resolves the dependency before the route body runs, and a
bad or missing token returns 401 without your code being reached.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select

from app.config import settings
from app.core.security import decode_access_token
from app.database import SessionDep
from app.models import User

# auto_error=False so a missing header reaches our handler and produces our own
# error message rather than FastAPI's default.
bearer_scheme = HTTPBearer(auto_error=False)

REFRESH_COOKIE_NAME = "sheaf_refresh"

_UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not signed in, or your session has expired.",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    session: SessionDep,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ] = None,
) -> User:
    if credentials is None or not credentials.credentials:
        raise _UNAUTHORIZED

    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise _UNAUTHORIZED

    # The token was valid when issued, but the account may have been deleted or
    # suspended since. Always re-check against the database.
    user = await session.scalar(
        select(User).where(
            User.id == user_id,
            User.deleted_at.is_(None),
            User.is_active.is_(True),
        )
    )
    if user is None:
        raise _UNAUTHORIZED

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


# --------------------------------------------------------------------------
# Refresh cookie
# --------------------------------------------------------------------------


def set_refresh_cookie(response: Response, raw_token: str) -> None:
    """
    httponly=True is the whole point: JavaScript cannot read this cookie, so an
    XSS bug cannot steal the session.

    path is scoped to /api/auth so the cookie is only sent on auth requests
    rather than attached to every API call.
    """
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,      # must be True over HTTPS in production
        samesite=settings.COOKIE_SAMESITE,  # "none" if API and frontend are on
                                            # different domains (requires secure=True)
        max_age=settings.REFRESH_TOKEN_DAYS * 24 * 60 * 60,
        path="/api/auth",
    )


def clear_refresh_cookie(response: Response) -> None:
    # Attributes must match set_cookie or the browser will not clear it.
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/api/auth",
    )


def get_refresh_token(request: Request) -> str:
    token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session to refresh. Sign in again.",
        )
    return token


def client_fingerprint(request: Request) -> tuple[str | None, str | None]:
    """User agent and IP, recorded against each session for the audit trail."""
    ua = request.headers.get("user-agent")
    ip = request.client.host if request.client else None
    # Behind a proxy the real client IP is in this header.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    return (ua[:500] if ua else None), ip
