"""
Resume request/response shapes.

The document is validated loosely on purpose: `content` must contain the six
sections the frontend expects and they must be the right JSON types, but the
fields *inside* each section are not enumerated. That is deliberate — the whole
reason the document lives in a JSONB column is so adding a "certifications"
section later is a frontend change, not a migration.
"""

import re
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

REQUIRED_SECTIONS = {
    "basics": dict,
    "experience": list,
    "education": list,
    "projects": list,
    "skills": list,
    "design": dict,
}


def validate_content(v: Any) -> dict:
    if not isinstance(v, dict):
        raise ValueError("content must be an object.")

    for section, expected in REQUIRED_SECTIONS.items():
        if section not in v:
            raise ValueError(f"content is missing the '{section}' section.")
        if not isinstance(v[section], expected):
            kind = "an object" if expected is dict else "an array"
            raise ValueError(f"content.{section} must be {kind}.")

    if len(str(v)) > 400_000:
        raise ValueError("This document is too large.")

    return v


class ResumeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: dict

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Give the document a name.")
        return cleaned

    @field_validator("content")
    @classmethod
    def content_shape(cls, v: dict) -> dict:
        return validate_content(v)


class ResumeUpdate(BaseModel):
    """
    Autosave payload. Every field optional so a publish toggle does not have to
    resend the whole document.

    `version` carries the version the client last read. When present the update
    only applies if the row still matches.
    """

    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: dict | None = None
    published: bool | None = None
    version: int | None = None

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Give the document a name.")
        return cleaned

    @field_validator("content")
    @classmethod
    def content_shape(cls, v: dict | None) -> dict | None:
        return None if v is None else validate_content(v)


class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    slug: str
    published: bool
    content: dict
    version: int
    created_at: datetime
    updated_at: datetime


class PublicResumeOut(BaseModel):
    """
    The share page, served without authentication.

    Note what is absent: user_id, version, anything about the owner.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    slug: str
    content: dict
    updated_at: datetime


def slugify(text: str) -> str:
    """Mirrors slugify() in the frontend's lib/storage.js."""
    s = re.sub(r"[^a-z0-9]+", "-", str(text or "untitled").lower())
    return s.strip("-")[:40] or "untitled"