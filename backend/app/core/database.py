"""
UCHAGUZI SAFI — Database Engine & Session Management
=====================================================
Async SQLAlchemy 2.0 setup for PostgreSQL.

Usage in route dependencies:
    async def get_candidates(db: AsyncSession = Depends(get_db)):
        ...
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

# ── Async Engine ─────────────────────────────────────────────────────
# pool_pre_ping keeps connections healthy; echo=True in dev for SQL logging
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# ── Session Factory ──────────────────────────────────────────────────
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Declarative Base ─────────────────────────────────────────────────
class Base(DeclarativeBase):
    """
    Base class for all ORM models.
    All Uchaguzi Safi models (Candidate, Contribution, Expenditure,
    Incident, etc.) inherit from this.
    """
    pass


# ── Dependency: DB Session ───────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an async database session.
    The session is automatically closed after the request completes.

    Example:
        @router.get("/candidates")
        async def list_candidates(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Candidate))
            return result.scalars().all()
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
