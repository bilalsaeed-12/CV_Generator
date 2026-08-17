"""
Authentication endpoints.

Maps to the frontend's src/lib/storage.js:

  signUp          ->  POST   /api/auth/signup
  signIn          ->  POST   /api/auth/login
  currentSession  ->  POST   /api/auth/refresh
  signOut         ->  POST   /api/auth/logout
  (new)           ->  POST   /api/auth/logout-all
  (new)           ->  GET    /api/auth/me
  updateProfile   ->  PATCH  /api/auth/me
  changePassword  ->  POST   /api/auth/change-password
  deleteAccount   ->  DELETE /api/auth/me
  (new)           ->  GET    /api/auth/sessions
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError

from app.core.deps import (
    CurrentUser,
    client_fingerprint,
    clear_refresh_cookie,
    get_refresh_token,
    set_refresh_cookie,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    dummy_verify,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.database import SessionDep
from app.models import AuthSession, User
from app.schemas.auth import (
    ChangePasswordRequest,
    DeleteAccountRequest,
    MessageResponse,
    SessionOut,
    SignInRequest,
    SignUpRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserOut,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Deliberately identical for "no such email" and "wrong password". Telling the
# two apart turns the login form into a tool for discovering who has an account.
_BAD_CREDENTIALS = "That email and password combination does not match an account."


async def _issue_session(
    session: SessionDep, user: User, request: Request, response: Response
) -> TokenResponse:
    """Create a refresh session, set the cookie, and return an access token."""
    raw, token_hash, expires_at = create_refresh_token()
    user_agent, ip = client_fingerprint(request)

    session.add(
        AuthSession(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip,
        )
    )

    set_refresh_cookie(response, raw)
    access_token, expires_in = create_access_token(user.id)
    await session.commit()

    return TokenResponse(
        access_token=access_token,
        expires_in=expires_in,
        user=UserOut.model_validate(user),
    )


# --------------------------------------------------------------------------
# POST /api/auth/signup
# --------------------------------------------------------------------------
@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    body: SignUpRequest, request: Request, response: Response, session: SessionDep
):
    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
    )
    session.add(user)

    try:
        # Push the INSERT now so a duplicate email surfaces here, where we can
        # turn it into a friendly 409, rather than at commit time.
        await session.flush()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="That email already has an account. Sign in instead.",
        ) from None

    return await _issue_session(session, user, request, response)


# --------------------------------------------------------------------------
# POST /api/auth/login
# --------------------------------------------------------------------------
@router.post("/login", response_model=TokenResponse)
async def login(
    body: SignInRequest, request: Request, response: Response, session: SessionDep
):
    user = await session.scalar(
        select(User).where(User.email == body.email, User.deleted_at.is_(None))
    )

    if user is None:
        # Spend the same time we would on a real check, so response timing does
        # not reveal whether the email exists.
        dummy_verify()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, _BAD_CREDENTIALS)

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, _BAD_CREDENTIALS)

    if not user.is_active:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "This account has been suspended. Contact support.",
        )

    user.last_login_at = datetime.now(UTC)
    return await _issue_session(session, user, request, response)


# --------------------------------------------------------------------------
# POST /api/auth/refresh
#
# Called on page load and whenever the access token expires. The browser sends
# the httpOnly cookie automatically — the frontend never handles this token.
# --------------------------------------------------------------------------
@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    response: Response,
    session: SessionDep,
    raw_token: str = Depends(get_refresh_token),
):
    auth_session = await session.scalar(
        select(AuthSession).where(AuthSession.token_hash == hash_refresh_token(raw_token))
    )

    if (
        auth_session is None
        or auth_session.revoked_at is not None
        or auth_session.expires_at <= datetime.now(UTC)
    ):
        clear_refresh_cookie(response)
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Your session has expired. Sign in again."
        )

    user = await session.scalar(
        select(User).where(
            User.id == auth_session.user_id,
            User.deleted_at.is_(None),
            User.is_active.is_(True),
        )
    )
    if user is None:
        clear_refresh_cookie(response)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "This account is no longer active.")

    # Rotation: the old token is retired and a new one issued. If a stolen token
    # is used, the real user's next refresh fails and the theft becomes visible.
    auth_session.revoked_at = datetime.now(UTC)
    auth_session.last_used_at = datetime.now(UTC)

    return await _issue_session(session, user, request, response)


# --------------------------------------------------------------------------
# POST /api/auth/logout
# --------------------------------------------------------------------------
@router.post("/logout", response_model=MessageResponse)
async def logout(request: Request, response: Response, session: SessionDep):
    raw_token = request.cookies.get("sheaf_refresh")

    if raw_token:
        await session.execute(
            update(AuthSession)
            .where(
                AuthSession.token_hash == hash_refresh_token(raw_token),
                AuthSession.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(UTC))
        )

    await session.commit()
    clear_refresh_cookie(response)
    # Always 200, even with no cookie — logging out should never fail.
    return MessageResponse(message="Signed out.")


# --------------------------------------------------------------------------
# POST /api/auth/logout-all
# --------------------------------------------------------------------------
@router.post("/logout-all", response_model=MessageResponse)
async def logout_all(user: CurrentUser, response: Response, session: SessionDep):
    result = await session.execute(
        update(AuthSession)
        .where(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )
    await session.commit()
    clear_refresh_cookie(response)
    return MessageResponse(message=f"Signed out of {result.rowcount} session(s).")


# --------------------------------------------------------------------------
# GET /api/auth/me
# --------------------------------------------------------------------------
@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser):
    return UserOut.model_validate(user)


# --------------------------------------------------------------------------
# PATCH /api/auth/me
# --------------------------------------------------------------------------
@router.patch("/me", response_model=UserOut)
async def update_profile(
    body: UpdateProfileRequest, user: CurrentUser, session: SessionDep
):
    if body.name is not None:
        user.name = body.name
    if body.headline is not None:
        user.headline = body.headline
    if body.email is not None:
        user.email = body.email

    try:
        await session.flush()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "That email is already in use by another account."
        ) from None
    await session.commit()
    return UserOut.model_validate(user)


# --------------------------------------------------------------------------
# POST /api/auth/change-password
# --------------------------------------------------------------------------
@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    body: ChangePasswordRequest,
    user: CurrentUser,
    response: Response,
    session: SessionDep,
):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Your current password is not correct."
        )

    user.password_hash = hash_password(body.new_password)

    # Changing a password must end every other session. If someone else had
    # access, this is the action that locks them out.
    await session.execute(
        update(AuthSession)
        .where(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )
    await session.commit()
    clear_refresh_cookie(response)

    return MessageResponse(message="Password changed. Sign in again with the new one.")


# --------------------------------------------------------------------------
# DELETE /api/auth/me
# --------------------------------------------------------------------------
@router.delete("/me", response_model=MessageResponse)
async def delete_account(
    body: DeleteAccountRequest,
    user: CurrentUser,
    response: Response,
    session: SessionDep,
):
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "That password is not correct."
        )

    # Soft delete, so an accidental deletion is recoverable within the retention
    # window. A scheduled job removes the rows for good later.
    now = datetime.now(UTC)
    user.deleted_at = now
    user.is_active = False

    from app.models import Resume  # local import avoids a circular import at module load

    await session.execute(
        update(Resume)
        .where(Resume.user_id == user.id, Resume.deleted_at.is_(None))
        .values(deleted_at=now, published=False)  # published=False kills public links now
    )
    await session.execute(
        update(AuthSession)
        .where(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None))
        .values(revoked_at=now)
    )
    await session.commit()
    clear_refresh_cookie(response)
    return MessageResponse(message="Account and documents deleted.")


# --------------------------------------------------------------------------
# GET /api/auth/sessions
# --------------------------------------------------------------------------
@router.get("/sessions", response_model=list[SessionOut])
async def list_sessions(user: CurrentUser, request: Request, session: SessionDep):
    rows = await session.scalars(
        select(AuthSession)
        .where(
            AuthSession.user_id == user.id,
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > datetime.now(UTC),
        )
        .order_by(AuthSession.last_used_at.desc())
    )

    current_raw = request.cookies.get("sheaf_refresh")
    current_hash = hash_refresh_token(current_raw) if current_raw else None

    out = []
    for row in rows:
        item = SessionOut.model_validate(row)
        item.current = row.token_hash == current_hash
        out.append(item)
    return out
