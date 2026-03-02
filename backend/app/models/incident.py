"""
UCHAGUZI SAFI — Incident Model
=================================
Represents a reported incident of public resource misuse during
the campaign period, tracked through the M3 Ripoti Ubadhirifu module.

ECF Act references:
  - s.2:   "public resource" definition: monies, vehicles/equipment,
           premises owned by State, state organs, statutory corporations
  - s.14:  Prohibition on using public resources to support candidates
  - s.14(2): Specific prohibition on state institutions and public officers
  - s.21:  Complaints to IEBC — any person may lodge a complaint

Module mapping:
  - M3 Ripoti Ubadhirifu: Incident submission & tracking
  - M2 Taswira: Incident heat map on county map
  - M5 Tahadhari: Alert feed for verified incidents

Human-centred design:
  - UCH-2027-XXXX tracking numbers for anonymous reporters
  - Anonymous submission supported (reporter fields nullable)
  - GPS coordinates from mobile device for location verification
"""

import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean, CheckConstraint, Date, DateTime, Float, ForeignKey,
    Index, String, Text, func,
)
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.candidate import Candidate
    from app.models.evidence import Evidence
    from app.models.incident_status_history import IncidentStatusHistory
    from app.models.party import PoliticalParty


# ═══════════════════════════════════════════════════════════════════
# ENUMERATIONS
# ═══════════════════════════════════════════════════════════════════

class IncidentType(str, enum.Enum):
    """
    Types of public resource misuse per ECF Act s.2 definition
    of "public resource" — paragraphs (a), (b), (c).
    """
    STATE_FUNDS = "STATE_FUNDS"             # s.2(a): Monies intended for public use
    VEHICLE_EQUIPMENT = "VEHICLE_EQUIPMENT" # s.2(b): State-owned vehicles/equipment
    PREMISES = "PREMISES"                   # s.2(c): State-owned/occupied premises
    PERSONNEL = "PERSONNEL"                 # s.14(2): Public officers used for campaigns
    OTHER = "OTHER"                         # Other forms of public resource misuse


class IncidentStatus(str, enum.Enum):
    """
    Lifecycle status of a reported incident.
    Mirrors the complaint process in ECF Act s.21.
    """
    SUBMITTED = "SUBMITTED"           # Initial report received
    UNDER_REVIEW = "UNDER_REVIEW"     # Being investigated
    VERIFIED = "VERIFIED"             # Evidence confirmed
    ESCALATED = "ESCALATED"           # Referred to IEBC per s.21(1)
    RESOLVED = "RESOLVED"             # Action taken
    REJECTED = "REJECTED"             # Insufficient evidence or false report


# ═══════════════════════════════════════════════════════════════════
# MODEL
# ═══════════════════════════════════════════════════════════════════

class Incident(BaseModel):
    __tablename__ = "incidents"

    # ── Tracking ─────────────────────────────────────────────────
    tracking_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        unique=True,
        doc="Public tracking number (format: UCH-2027-XXXX). "
            "Generated on submission. Used by anonymous reporters "
            "to check status without login (M3 Ripoti tracking page).",
    )

    # ── Classification ───────────────────────────────────────────
    incident_type: Mapped[IncidentType] = mapped_column(
        ENUM(IncidentType, name="incident_type_enum", create_type=True),
        nullable=False,
        doc="Type of public resource misuse per ECF Act s.2 'public resource' "
            "definition. Maps to the three categories: monies, vehicles, premises.",
    )

    # ── Description ──────────────────────────────────────────────
    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        doc="Brief title summarising the incident.",
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Detailed description of the incident. Supports the 'complaint' "
            "lodged under ECF Act s.21(1).",
    )

    # ── When & Where ─────────────────────────────────────────────
    date_occurred: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        doc="Date the incident occurred or was observed.",
    )
    date_reported: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        doc="Timestamp when the incident was reported to the system.",
    )

    # Location — GPS from mobile device (M3 Ripoti mobile form)
    location_description: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="Human-readable location description (e.g., 'Outside Uhuru Gardens, Nairobi').",
    )
    location_lat: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Latitude coordinate from reporter's mobile device.",
    )
    location_lng: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="Longitude coordinate from reporter's mobile device.",
    )
    county: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="Kenya county where the incident occurred (1 of 47). "
            "Used for county-level aggregation in M2 Taswira.",
    )
    constituency: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
        doc="Constituency where the incident occurred.",
    )

    # ── Linked Entities (nullable — may not be known at report time) ─
    candidate_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id", ondelete="SET NULL"),
        nullable=True,
        doc="FK to candidate allegedly involved. Nullable because the "
            "reporter may not know which candidate benefited.",
    )
    party_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("political_parties.id", ondelete="SET NULL"),
        nullable=True,
        doc="FK to party allegedly involved.",
    )

    # ── Status ───────────────────────────────────────────────────
    status: Mapped[IncidentStatus] = mapped_column(
        ENUM(IncidentStatus, name="incident_status_enum", create_type=True),
        nullable=False,
        default=IncidentStatus.SUBMITTED,
        doc="Current review status. Follows the complaint lifecycle "
            "per ECF Act s.21: submission → investigation → determination.",
    )

    # ── Reporter Information (nullable for anonymous reports) ────
    is_anonymous: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
        doc="Whether the reporter chose to remain anonymous. "
            "If True, reporter fields are NULL.",
    )
    reporter_name: Mapped[Optional[str]] = mapped_column(
        String(300),
        nullable=True,
        doc="Reporter's name (NULL if anonymous).",
    )
    reporter_email: Mapped[Optional[str]] = mapped_column(
        String(254),
        nullable=True,
        doc="Reporter's email for status updates. Stored encrypted.",
    )
    reporter_phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        doc="Reporter's phone number. Stored encrypted.",
    )

    # ── Relationships ────────────────────────────────────────────
    candidate: Mapped[Optional["Candidate"]] = relationship(
        "Candidate",
        back_populates="incidents",
        doc="Candidate allegedly involved in the incident.",
    )
    party: Mapped[Optional["PoliticalParty"]] = relationship(
        "PoliticalParty",
        back_populates="incidents",
        doc="Political party allegedly involved.",
    )
    evidence_files: Mapped[List["Evidence"]] = relationship(
        "Evidence",
        back_populates="incident",
        lazy="selectin",
        cascade="all, delete-orphan",
        doc="Supporting evidence (photos, videos, documents).",
    )
    status_history: Mapped[List["IncidentStatusHistory"]] = relationship(
        "IncidentStatusHistory",
        back_populates="incident",
        lazy="selectin",
        cascade="all, delete-orphan",
        order_by="IncidentStatusHistory.changed_at.desc()",
        doc="Audit trail of all status changes.",
    )

    # ── Indexes & Constraints ────────────────────────────────────
    __table_args__ = (
        Index("ix_incidents_tracking_number", "tracking_number"),
        Index("ix_incidents_county", "county"),
        Index("ix_incidents_status", "status"),
        Index("ix_incidents_incident_type", "incident_type"),
        Index("ix_incidents_date_occurred", "date_occurred"),
        Index("ix_incidents_candidate_id", "candidate_id"),
        Index("ix_incidents_party_id", "party_id"),
        Index("ix_incidents_county_status", "county", "status"),

        # GPS coordinates must be valid Kenya range if provided
        CheckConstraint(
            "(location_lat IS NULL) OR (location_lat BETWEEN -4.7 AND 5.5)",
            name="ck_incidents_lat_kenya_range",
        ),
        CheckConstraint(
            "(location_lng IS NULL) OR (location_lng BETWEEN 33.9 AND 41.9)",
            name="ck_incidents_lng_kenya_range",
        ),

        {"comment": "Reported incidents of public resource misuse "
                     "per ECF Act s.14. Core entity for M3 Ripoti Ubadhirifu."},
    )

    def __repr__(self) -> str:
        return (
            f"<Incident(tracking='{self.tracking_number}', "
            f"type={self.incident_type.value}, status={self.status.value})>"
        )
