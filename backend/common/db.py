# @module: SharedCommon.backend/common/db.py
# @spec_section_id: implementation_blueprint
# @req_ids: N/A
# @agent: CodeGenerationAgent
# @run_id: run-p4-1790144399
# @version: 1

import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

# Database URL must be provided via environment variables with no hardcoded fallbacks.
# This ensures security compliance and prevents silent failures in production.
DATABASE_URL = os.environ["DATABASE_URL"]

# Initialize the asynchronous SQLAlchemy engine for PostgreSQL
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
)

# Configure the asynchronous session maker
async_session_maker = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models in the FinPulse Engine."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency provider for FastAPI to yield thread-safe asynchronous database sessions.

    Ensures proper transaction management and resource cleanup.
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()