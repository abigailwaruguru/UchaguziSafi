"""
UCHAGUZI SAFI — Alembic Migration Environment
==============================================
Configures Alembic to use our async SQLAlchemy engine and
auto-detect schema changes across all campaign finance models.

Run migrations:
    alembic revision --autogenerate -m "description"
    alembic upgrade head
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import get_settings
from app.core.database import Base

# ── Import ALL models so Alembic can detect them ─────────────────────
# Uncomment each line as you create the corresponding model module.
# These imports ensure the ORM metadata is populated before autogenerate.

# from app.models.user import User                  # M6 Usimamizi
# from app.models.candidate import Candidate        # M4 Tafuta
# from app.models.political_party import PoliticalParty  # M4 Tafuta
# from app.models.contribution import Contribution  # M1 Fedha
# from app.models.expenditure import Expenditure    # M1 Fedha
# from app.models.incident import Incident          # M3 Ripoti Ubadhirifu
# from app.models.alert import Alert                # M5 Tahadhari
# from app.models.expenditure_committee import ExpenditureCommittee  # ECF Act s.7-9

# ── Alembic Config ───────────────────────────────────────────────────
config = context.config

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata for autogeneration
target_metadata = Base.metadata

# Override sqlalchemy.url with our settings (sync URL for Alembic)
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url_sync)


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode — generates SQL without a live DB.
    Useful for generating migration scripts in CI/CD.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Execute migrations against a live database connection."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        # compare_type detects column type changes (e.g., Integer → BigInteger)
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """
    Create an async engine and run migrations.
    We use the SYNC url here because Alembic's migration runner
    is synchronous; asyncpg is only for the application runtime.
    """
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode with a live database."""
    asyncio.run(run_async_migrations())


# ── Entry Point ──────────────────────────────────────────────────────
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
