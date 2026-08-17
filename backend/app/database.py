"""
Database engine and session management.

One engine per process, one session per request. The session is handed to
routes via the `SessionDep` dependency, which commits on success and rolls back
if the route raised — so no route ever has to remember to clean up.
"""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,          # set True to see every SQL statement while debugging
    pool_size=10,        # connections kept open
    max_overflow=20,     # extra connections allowed under burst load
    pool_pre_ping=True,  # verify a connection is alive before using it;
                         # stops "server closed the connection" after idle periods
)

SessionFactory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # keep attribute access working after commit,
                             # otherwise returning an ORM object triggers a lazy
                             # reload outside the session and blows up
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Yields a session for one request.

    Commits if the route returned normally. Rolls back on any exception,
    including the HTTPExceptions we raise deliberately — a failed request must
    never leave a half-written row behind.
    """
    async with SessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# Annotated alias so routes read `session: SessionDep` instead of repeating
# Depends(get_session) everywhere.
SessionDep = Annotated[AsyncSession, Depends(get_session)]
