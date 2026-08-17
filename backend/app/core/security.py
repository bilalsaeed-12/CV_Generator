"""
Password hashing and token handling.

Two different token types, on purpose:

  ACCESS token   JWT, short-lived (15 min), stateless. Sent in the
                 Authorization header. Not stored anywhere server-side, so it
                 cannot be revoked — which is why it expires quickly.

  REFRESH token  Opaque random string, long-lived (30 days), stateful. Stored
                 in auth_sessions as a SHA-256 hash and delivered to the browser
                 as an httpOnly cookie. Because it is in the database, it CAN be
                 revoked: that is what logout does.

The split gives you fast stateless auth on every request plus real revocation.
"""

import hashlib
import secrets
import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.config import settings

# --------------------------------------------------------------------------
# Passwords
# --------------------------------------------------------------------------

# Cost 12 ≈ 250ms per hash. Deliberately slow: it is what makes brute-forcing a
# leaked hash impractical. Do not lower it to speed up your tests.
_BCRYPT_ROUNDS = 12

# bcrypt silently truncates anything past 72 bytes, so a 200-character password
# would only have its first 72 bytes checked. Reject instead of truncating.
MAX_PASSWORD_BYTES = 72


def hash_password(plain: str) -> str:
    encoded = plain.encode("utf-8")
    if len(encoded) > MAX_PASSWORD_BYTES:
        raise ValueError("Password is too long (max 72 bytes).")
    return bcrypt.hashpw(encoded, bcrypt.gensalt(_BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        # Malformed hash in the database — treat as a failed login, never a 500.
        return False


def dummy_verify() -> None:
    """
    Burn roughly the same time as a real password check.

    Called when the email does not exist. Without it, a missing account returns
    in 2ms and a wrong password in 250ms, and that timing difference tells an
    attacker which emails are registered.
    """
    bcrypt.checkpw(
        b"timing-equalizer",
        b"$2b$12$Rk0x3.POJDlVmARy9BAQBOGiQdtzBTx8cnvOlD3wHxdbadHf6KY0m",
    )


# --------------------------------------------------------------------------
# Access tokens (JWT)
# --------------------------------------------------------------------------


def create_access_token(user_id: uuid.UUID) -> tuple[str, int]:
    """Returns (token, seconds_until_expiry)."""
    now = datetime.now(UTC)
    expires = now + timedelta(minutes=settings.ACCESS_TOKEN_MINUTES)

    payload = {
        "sub": str(user_id),  # subject — who this token is for
        "iat": now,           # issued at
        "exp": expires,       # expiry; PyJWT enforces this on decode
        "typ": "access",      # so a refresh token can never be used as an access token
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, settings.ACCESS_TOKEN_MINUTES * 60


def decode_access_token(token: str) -> uuid.UUID | None:
    """Returns the user id, or None if the token is invalid, expired, or wrong type."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
    except jwt.PyJWTError:
        return None

    if payload.get("typ") != "access":
        return None

    try:
        return uuid.UUID(payload["sub"])
    except (KeyError, ValueError):
        return None


# --------------------------------------------------------------------------
# Refresh tokens (opaque + hashed at rest)
# --------------------------------------------------------------------------


def create_refresh_token() -> tuple[str, str, datetime]:
    """
    Returns (raw_token, token_hash, expires_at).

    The raw token goes to the browser once, in a cookie. Only the hash is
    stored, exactly like a password.
    """
    raw = secrets.token_urlsafe(48)
    return (
        raw,
        hash_refresh_token(raw),
        datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_DAYS),
    )


def hash_refresh_token(raw: str) -> str:
    """
    Plain SHA-256, not bcrypt.

    Correct here because the token is 48 bytes of cryptographic randomness —
    there is no dictionary to attack, so the slow hash bcrypt provides buys
    nothing and would just make every refresh request 250ms slower.
    """
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
