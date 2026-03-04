"""
UCHAGUZI SAFI — Alembic Migration Environment
==============================================
Configures Alembic to use our SQLAlchemy engine and
auto-detect schema changes across all campaign finance models.

Run migrations:
    alembic revision --autogenerate -m "description"
    alembic upgrade head
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool
from sqlalchemy.engine import Connection

from app.core.config import get_settings
from app.models.base import Base

# ── Import ALL models so Alembic can detect them ─────────────────────
# These imports ensure the ORM metadata is populated before autogenerate.

from app.models.candidate import Candidate              # M4 Tafuta
from app.models.party import PoliticalParty             # M4 Tafuta
from app.models.contribution import Contribution        # M1 Fedha
from app.models.expenditure import Expenditure          # M1 Fedha
from app.models.incident import Incident                # M3 Ripoti Ubadhirifu
from app.models.incident_status_history import IncidentStatusHistory
from app.models.evidence import Evidence
from app.models.spending_limit import SpendingLimit

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
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode with a live database."""
    connectable = create_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        do_run_migrations(connection)

    connectable.dispose()


# ── Entry Point ──────────────────────────────────────────────────────
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
