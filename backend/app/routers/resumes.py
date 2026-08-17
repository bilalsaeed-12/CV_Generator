"""
Resume endpoints.

TWO RULES, applied without exception:

  1. Every authenticated query filters on BOTH id AND user_id. Not "is this
     person signed in" but "does this person own this row". Missing that check
     is the classic CRUD hole: change the id in the URL, read someone else's
     document.

  2. A row that is not yours returns 404, never 403. A 403 confirms the
     document exists, which is itself a leak.
"""

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.core.deps import CurrentUser
from app.database import SessionDep
from app.models import Resume
from app.schemas.resume import (
    PublicResumeOut,
    ResumeCreate,
    ResumeOut,
    ResumeUpdate,
    slugify,
)

router = APIRouter(prefix="/api/resumes", tags=["resumes"])
public_router = APIRouter(prefix="/api/public/resumes", tags=["public"])

_NOT_FOUND = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="That document no longer exists.",
)


async def _unique_slug(session: SessionDep, base: str) -> str:
    """Slugs are globally unique, so append a counter until one is free."""
    base = slugify(base)
    slug = base
    n = 2
    while await session.scalar(select(func.count()).select_from(Resume).where(Resume.slug == slug)):
        slug = f"{base}-{n}"
        n += 1
    return slug


async def _owned(session: SessionDep, resume_id: uuid.UUID, user_id: uuid.UUID) -> Resume:
    """Fetch a resume that belongs to this user, or 404."""
    resume = await session.scalar(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.user_id == user_id,
            Resume.deleted_at.is_(None),
        )
    )
    if resume is None:
        raise _NOT_FOUND
    return resume


@router.get("", response_model=list[ResumeOut])
async def list_resumes(user: CurrentUser, session: SessionDep):
    """
    Returns full documents, not just metadata, because the dashboard renders a
    real thumbnail of each page and computes a completeness score from the
    content. Fine while a user has a handful of documents.
    """
    rows = await session.scalars(
        select(Resume)
        .where(Resume.user_id == user.id, Resume.deleted_at.is_(None))
        .order_by(Resume.updated_at.desc())
    )
    return [ResumeOut.model_validate(r) for r in rows]


@router.post("", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def create_resume(body: ResumeCreate, user: CurrentUser, session: SessionDep):
    basics = body.content.get("basics") or {}
    slug_source = basics.get("fullName") or body.title

    resume = Resume(
        user_id=user.id,
        title=body.title,
        slug=await _unique_slug(session, slug_source),
        content=body.content,
    )
    session.add(resume)
    await session.flush()
    await session.refresh(resume)
    await session.commit()
    return ResumeOut.model_validate(resume)


@router.get("/{resume_id}", response_model=ResumeOut)
async def get_resume(resume_id: uuid.UUID, user: CurrentUser, session: SessionDep):
    return ResumeOut.model_validate(await _owned(session, resume_id, user.id))


@router.patch("/{resume_id}", response_model=ResumeOut)
async def save_resume(
    resume_id: uuid.UUID, body: ResumeUpdate, user: CurrentUser, session: SessionDep
):
    resume = await _owned(session, resume_id, user.id)

    # Optimistic locking. Two tabs open on the same document would otherwise
    # silently overwrite each other — last write wins, earlier edits vanish.
    if body.version is not None and body.version != resume.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This document was changed somewhere else. "
                "Reload to get the latest version."
            ),
        )

    if body.title is not None:
        resume.title = body.title
    if body.content is not None:
        resume.content = body.content
    if body.published is not None:
        resume.published = body.published

    resume.version += 1

    await session.flush()
    await session.refresh(resume)
    await session.commit()
    return ResumeOut.model_validate(resume)


@router.post(
    "/{resume_id}/duplicate", response_model=ResumeOut, status_code=status.HTTP_201_CREATED
)
async def duplicate_resume(resume_id: uuid.UUID, user: CurrentUser, session: SessionDep):
    source = await _owned(session, resume_id, user.id)

    copy = Resume(
        user_id=user.id,
        title=f"{source.title} copy",
        slug=await _unique_slug(session, f"{source.slug}-copy"),
        content=source.content,
        published=False,  # a copy is never born public
    )
    session.add(copy)
    await session.flush()
    await session.refresh(copy)
    await session.commit()
    return ResumeOut.model_validate(copy)


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(resume_id: uuid.UUID, user: CurrentUser, session: SessionDep):
    resume = await _owned(session, resume_id, user.id)

    # Soft delete, recoverable inside the retention window.
    # published=False so the public link dies this instant.
    resume.deleted_at = datetime.now(UTC)
    resume.published = False

    await session.commit()
    return None


@public_router.get("/{slug}", response_model=PublicResumeOut)
async def get_public_resume(slug: str, session: SessionDep):
    resume = await session.scalar(
        select(Resume).where(
            Resume.slug == slug,
            Resume.published.is_(True),
            Resume.deleted_at.is_(None),
        )
    )
    if resume is None:
        # Same message whether it never existed or was unpublished.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No published document lives at this address.",
        )
    return PublicResumeOut.model_validate(resume)