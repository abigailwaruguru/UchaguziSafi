"""
UCHAGUZI SAFI — Base Model
============================
Abstract base providing UUID primary keys and audit timestamps.
Every table in the system inherits these fields, supporting the
record-keeping obligations under ECF Act s.26.

Design decisions:
  - UUIDs prevent sequential ID enumeration (privacy for reporters)
  - server_default timestamps ensure accuracy regardless of app clock
  - updated_at auto-updates on any row change for audit trail
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """
    Declarative base for all Uchaguzi Safi ORM models.
    Imported by alembic/env.py for migration autogeneration.
    """
    pass


class TimestampMixin:
    """
    Mixin providing created_at / updated_at audit columns.
    ECF Act s.26 requires records of all funds received and spent;
    these timestamps support that audit obligation.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Row creation timestamp (UTC). Immutable after INSERT.",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        doc="Last modification timestamp (UTC). Auto-updates on change.",
    )


class UUIDPrimaryKeyMixin:
    """
    Mixin providing a UUID v4 primary key.
    UUIDs are used instead of sequential integers to:
      1. Prevent enumeration attacks on incident tracking endpoints
      2. Allow distributed ID generation (future multi-node deployment)
      3. Make tracking numbers opaque for anonymous reporters (M3 Ripoti)
    """

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
        doc="Unique identifier (UUID v4).",
    )


class BaseModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """
    Abstract base model combining UUID PK + audit timestamps.
    All concrete models inherit from this class.

    Usage:
        class Candidate(BaseModel):
            __tablename__ = "candidates"
            name: Mapped[str] = mapped_column(String(200))
    """

    __abstract__ = True
