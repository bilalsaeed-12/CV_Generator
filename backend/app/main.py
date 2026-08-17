"""
Application entrypoint.

Run:  uvicorn app.main:app --reload
Docs: http://localhost:8000/docs
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.routers import auth, health,resumes

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s  %(levelname)-8s %(name)s  %(message)s"
)
log = logging.getLogger("sheaf")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fail loudly at boot rather than on the first request, so a bad
    # DATABASE_URL is obvious immediately.
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        log.info("Database connection OK")
    except Exception as exc:
        log.error("DATABASE UNREACHABLE at startup: %s", exc)
        log.error("Check DATABASE_URL in .env and that Postgres is running.")

    log.info("CORS origins allowed: %s", settings.cors_origins)
    yield
    await engine.dispose()
    log.info("Shut down cleanly")


app = FastAPI(
    title="Sheaf API",
    description="Backend for the Sheaf resume builder.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url=None,
)

# --------------------------------------------------------------------------
# CORS
#
# allow_credentials=True is required for the httpOnly refresh cookie to be sent
# and stored. Note that browsers refuse credentialed requests when
# allow_origins is "*", which is why origins must be listed explicitly.
# --------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# --------------------------------------------------------------------------
# Error shape
#
# One consistent body for every error: {"detail": "..."} — so the frontend can
# read err.detail without special-casing validation failures.
# --------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    """Turn Pydantic's nested error list into one readable sentence."""
    problems = []
    for err in exc.errors():
        field = ".".join(str(p) for p in err["loc"] if p not in ("body", "query"))
        msg = err["msg"].removeprefix("Value error, ")
        problems.append(f"{field}: {msg}" if field else msg)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": " ".join(problems), "errors": problems},
    )


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    """
    Last resort. Log the real error for us, return something generic to the
    client — stack traces and driver messages must never reach the browser.
    """
    log.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Something went wrong on our side. Please try again."},
    )


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(resumes.router)
app.include_router(resumes.public_router)


@app.get("/", tags=["health"])
async def root():
    return {
        "name": "Sheaf API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health/db",
    }
