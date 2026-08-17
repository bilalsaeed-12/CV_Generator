"""
Request and response shapes.

FastAPI validates every incoming body against these before your route runs, and
serialises every response through them — which is what guarantees a
password_hash can never leak out of an endpoint by accident.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.security import MAX_PASSWORD_BYTES

# --------------------------------------------------------------------------
# Shared password rule — matches lib/utils.js passwordProblem() on the frontend
# --------------------------------------------------------------------------


def _validate_password(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Use at least 8 characters.")
    if len(v.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError("That password is too long.")
    if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
        raise ValueError("Mix in at least one letter and one number.")
    return v


# --------------------------------------------------------------------------
# Requests
# --------------------------------------------------------------------------


class SignUpRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Tell us what to call you.")
        return cleaned

    @field_validator("password")
    @classmethod
    def password_rules(cls, v: str) -> str:
        return _validate_password(v)


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateProfileRequest(BaseModel):
    """All optional — this is a PATCH, so omitted fields stay unchanged."""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    headline: str | None = Field(default=None, max_length=200)

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Name cannot be blank.")
        return cleaned


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_rules(cls, v: str) -> str:
        return _validate_password(v)


class DeleteAccountRequest(BaseModel):
    """Deleting everything requires proving you are still the account holder."""

    password: str


# --------------------------------------------------------------------------
# Responses
# --------------------------------------------------------------------------


class UserOut(BaseModel):
    """
    The only user shape that ever leaves the API.

    Note what is absent: password_hash. It is not in this model, so it cannot
    be serialised even if a route hands over the full ORM object.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    name: str
    headline: str | None = None
    created_at: datetime


class TokenResponse(BaseModel):
    """
    Returned by signup, login, and refresh.

    The refresh token is deliberately not in here — it travels only as an
    httpOnly cookie, where JavaScript cannot read it.
    """

    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserOut


class MessageResponse(BaseModel):
    message: str


class SessionOut(BaseModel):
    """One active login, for a 'where am I signed in' screen."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_agent: str | None = None
    ip_address: str | None = None
    created_at: datetime
    last_used_at: datetime
    expires_at: datetime
    current: bool = False

    @field_validator("ip_address", mode="before")
    @classmethod
    def coerce_inet(cls, v):
        """
        Postgres INET comes back from asyncpg as an IPv4Address/IPv6Address
        object, not a str. Stringify it before Pydantic type-checks the field.
        """
        return str(v) if v is not None else None
