"""
UCHAGUZI SAFI — PoliticalParty Model
=======================================
Represents a political party registered under the Political Parties
Act (Cap. 7D) as referenced in ECF Act s.2.

ECF Act references:
  - s.2:   "political party" defined as registered under Cap. 7D
  - s.7:   Party expenditure committee (9 members, gender & regional diversity)
  - s.10:  Party submission of expenditure reports to IEBC
  - s.11:  Party as a lawful source of campaign funds
  - s.14(5): Political Parties Fund excluded from public resource prohibition

Module mapping:
  - M4 Tafuta: Party search and registry
  - M1 Fedha: Party-level financial dashboards
"""

from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Date, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.candidate import Candidate
    from app.models.incident import Incident


class PoliticalParty(BaseModel):
    __tablename__ = "political_parties"

    # ── Core Identity ────────────────────────────────────────────
    name: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        unique=True,
        doc="Official registered name of the political party.",
    )
    abbreviation: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        unique=True,
        doc="Party abbreviation/acronym (e.g., UDA, ODM, ANC).",
    )
    registration_number: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        unique=True,
        doc="Registration number assigned by the Registrar of Political Parties (Cap. 7D).",
    )

    # ── Visual Identity ──────────────────────────────────────────
    logo_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="URL to the party logo image. Used in M4 Tafuta search results.",
    )

    # ── Administrative Details ───────────────────────────────────
    founded_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
        doc="Date the party was officially founded.",
    )
    headquarters: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="Physical address of the party headquarters.",
    )

    # ── Status ───────────────────────────────────────────────────
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
        doc="Whether the party is currently active and registered. "
            "Inactive parties cannot field candidates.",
    )

    # ── Contact (for IEBC correspondence per s.6(4)) ─────────────
    contact_email: Mapped[Optional[str]] = mapped_column(
        String(254),
        nullable=True,
        doc="Official party contact email for IEBC notifications.",
    )
    contact_phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        doc="Official party phone number.",
    )

    # ── Description ──────────────────────────────────────────────
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Brief description of the party's platform and policies.",
    )

    # ── Relationships ────────────────────────────────────────────
    candidates: Mapped[List["Candidate"]] = relationship(
        "Candidate",
        back_populates="party",
        lazy="selectin",
        doc="Candidates sponsored by this party (ECF Act s.2 'party candidate').",
    )

    incidents: Mapped[List["Incident"]] = relationship(
        "Incident",
        back_populates="party",
        lazy="selectin",
        doc="Incidents of alleged public resource misuse linked to this party.",
    )

    # ── Indexes ──────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_parties_name_trgm", "name", postgresql_using="gin",
              postgresql_ops={"name": "gin_trgm_ops"}),
        Index("ix_parties_abbreviation", "abbreviation"),
        Index("ix_parties_is_active", "is_active"),
        {"comment": "Political parties registered under Cap. 7D. "
                     "Referenced throughout ECF Act Cap. 7A."},
    )

    def __repr__(self) -> str:
        return f"<PoliticalParty(name='{self.name}', abbr='{self.abbreviation}')>"
