"""
ORM models.

These mirror db/01_schema.sql exactly. The database is the source of truth for
constraints — the CHECK constraints, generated columns, and triggers live there
and are documented here so the two do not drift.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Computed,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import CITEXT, INET, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )

    email: Mapped[str] = mapped_column(CITEXT, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    headline: Mapped[str | None] = mapped_column(Text)

    email_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="true"
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    # Maintained by the set_updated_at() trigger, not by the application.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    resumes: Mapped[list["Resume"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["AuthSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    title: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    published: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )

    # The whole document. A CHECK constraint in the database guarantees every
    # required section is present and correctly typed.
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Postgres computes these from content on write. Never assign to them —
    # the database rejects any INSERT or UPDATE that tries.
    full_name: Mapped[str | None] = mapped_column(
        Text, Computed("content -> 'basics' ->> 'fullName'", persisted=True)
    )
    headline: Mapped[str | None] = mapped_column(
        Text, Computed("content -> 'basics' ->> 'headline'", persisted=True)
    )

    # Optimistic locking counter. See routers/resumes.py.
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="resumes")


class AuthSession(Base):
    """
    One row per refresh token.

    Only the SHA-256 hash of the token is stored, so a database leak does not
    hand an attacker a set of working sessions.
    """

    __tablename__ = "auth_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    token_hash: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user_agent: Mapped[str | None] = mapped_column(Text)
    ip_address: Mapped[str | None] = mapped_column(INET)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    last_used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="sessions")
