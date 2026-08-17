"""
Health checks.

/api/health       cheap liveness probe — is the process up
/api/health/db    does a real database round trip
"""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from app.config import settings
from app.database import SessionDep

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("")
async def health():
    return {"status": "ok", "environment": settings.ENVIRONMENT}


@router.get("/db")
async def health_db(session: SessionDep):
    """
    Proves the app can actually reach Postgres and sees the expected tables.
    This is the endpoint to hit first when something is broken.
    """
    try:
        version = await session.scalar(text("SELECT version()"))
        tables = await session.scalars(
            text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' ORDER BY table_name"
            )
        )
        found = list(tables)
    except Exception as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            f"Database unreachable: {type(exc).__name__}",
        ) from exc

    expected = {"users", "resumes", "auth_sessions"}
    missing = sorted(expected - set(found))

    return {
        "status": "ok" if not missing else "schema_incomplete",
        "postgres": version.split(",")[0] if version else None,
        "tables": found,
        "missing_tables": missing,
    }
