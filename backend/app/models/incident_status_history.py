"""
UCHAGUZI SAFI — Incident Status History Model
================================================
Audit trail tracking every status change for an incident.
Supports transparency in the complaint resolution process
per ECF Act s.21 and enables status tracking via the
M3 Ripoti Ubadhirifu tracking page.

ECF Act s.21(3) timelines:
  - 7 days for complaints filed before an election
  - 14 days for complaints filed after an election
This history table provides the audit evidence for timeline compliance.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.incident import IncidentStatus

if TYPE_CHECKING:
    from app.models.incident import Incident


class IncidentStatusHistory(BaseModel):
    __tablename__ = "incident_status_history"

    # ── Incident Link ────────────────────────────────────────────
    incident_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False,
        doc="FK to the incident whose status changed.",
    )

    # ── Status Change ────────────────────────────────────────────
    old_status: Mapped[Optional[IncidentStatus]] = mapped_column(
        ENUM(IncidentStatus, name="incident_status_enum", create_type=False),
        nullable=True,
        doc="Previous status. NULL for the initial SUBMITTED entry.",
    )
    new_status: Mapped[IncidentStatus] = mapped_column(
        ENUM(IncidentStatus, name="incident_status_enum", create_type=False),
        nullable=False,
        doc="New status after the change.",
    )

    # ── Context ──────────────────────────────────────────────────
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Reviewer's notes explaining the status change. "
            "Visible on the M3 Ripoti tracking page.",
    )
    changed_by: Mapped[Optional[str]] = mapped_column(
        String(300),
        nullable=True,
        doc="Name or identifier of the person who made the change. "
            "Could be a system user or 'SYSTEM' for automated transitions.",
    )
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        doc="Timestamp of the status change.",
    )

    # ── Relationships ────────────────────────────────────────────
    incident: Mapped["Incident"] = relationship(
        "Incident",
        back_populates="status_history",
        doc="The incident this status change belongs to.",
    )

    # ── Indexes ──────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_incident_status_history_incident_id", "incident_id"),
        Index("ix_incident_status_history_changed_at", "changed_at"),
        Index("ix_incident_status_history_new_status", "new_status"),
        {"comment": "Audit trail for incident status changes. "
                     "Supports ECF Act s.21(3) timeline compliance."},
    )

    def __repr__(self) -> str:
        return (
            f"<IncidentStatusHistory(incident={self.incident_id}, "
            f"{self.old_status} → {self.new_status})>"
        )
