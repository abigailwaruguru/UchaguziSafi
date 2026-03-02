"""
UCHAGUZI SAFI — Candidate Model
==================================
Represents a candidate contesting for an elective post, as defined
in ECF Act s.2 ("candidate means a person contesting for an elective post").

ECF Act references:
  - s.2:   Candidate definition; "party candidate" vs independent
  - s.6:   Authorised persons — candidates must register with IEBC
  - s.8:   Independent candidate expenditure committee (3 members)
  - s.10:  Candidate submission of expenditure reports
  - s.12:  Contribution limits apply per candidate
  - s.18:  IEBC-gazetted spending limits per election type
  - s.23:  Offences by candidates (false info, exceeding limits)

Module mapping:
  - M4 Tafuta: Candidate search, profile, registry
  - M1 Fedha: Candidate financial dashboard
  - M2 Taswira: Candidate spending visualisation on county map

Kenya electoral structure:
  - 1 President (national)
  - 47 Governors (per county)
  - 47 Senators (per county)
  - 47 Women Representatives (per county)
  - 290 Members of Parliament (per constituency)
  - 1,450 Members of County Assembly (per ward)
"""

import enum
import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    Boolean, Date, ForeignKey, Index, Numeric, String, Text,
)
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.contribution import Contribution
    from app.models.expenditure import Expenditure
    from app.models.incident import Incident
    from app.models.party import PoliticalParty


# ═══════════════════════════════════════════════════════════════════
# ENUMERATIONS
# ═══════════════════════════════════════════════════════════════════

class ElectionType(str, enum.Enum):
    """
    Kenya's elective posts per the Constitution of Kenya 2010.
    Each type has distinct IEBC-gazetted spending limits (ECF Act s.18).
    """
    PRESIDENTIAL = "PRESIDENTIAL"
    GOVERNOR = "GOVERNOR"
    SENATOR = "SENATOR"
    WOMEN_REP = "WOMEN_REP"
    MP = "MP"                   # Member of Parliament (constituency)
    MCA = "MCA"                 # Member of County Assembly (ward)


class CandidateStatus(str, enum.Enum):
    """
    Lifecycle status of a candidate in the election process.
    DISQUALIFIED maps to ECF Act s.21(5)(f) and s.23(3).
    """
    NOMINATED = "NOMINATED"         # Party nomination received
    CLEARED = "CLEARED"             # IEBC clearance obtained
    ACTIVE = "ACTIVE"               # Actively campaigning
    ELECTED = "ELECTED"             # Won the election
    DISQUALIFIED = "DISQUALIFIED"   # Disqualified per ECF Act s.23(3)
    WITHDRAWN = "WITHDRAWN"         # Voluntarily withdrew


# ═══════════════════════════════════════════════════════════════════
# MODEL
# ═══════════════════════════════════════════════════════════════════

class Candidate(BaseModel):
    __tablename__ = "candidates"

    # ── Personal Information ─────────────────────────────────────
    full_name: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        doc="Full legal name of the candidate.",
    )
    photo_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="URL to candidate's official photo. Displayed in M4 Tafuta.",
    )
    bio: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Brief biography or campaign platform summary.",
    )

    # ── Party Affiliation ────────────────────────────────────────
    party_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("political_parties.id", ondelete="SET NULL"),
        nullable=True,
        doc="FK to political party. NULL for independent candidates "
            "(who must form a 3-member expenditure committee per ECF Act s.8).",
    )
    is_independent: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
        doc="True if candidate is independent (not party-sponsored). "
            "Independent candidates have separate expenditure committee rules (s.8).",
    )

    # ── Electoral Position ───────────────────────────────────────
    election_type: Mapped[ElectionType] = mapped_column(
        ENUM(ElectionType, name="election_type_enum", create_type=True),
        nullable=False,
        doc="Type of elective post being contested. Determines applicable "
            "spending limits per IEBC gazette notice (ECF Act s.18).",
    )
    county: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="One of Kenya's 47 counties. Used for geographic filtering in "
            "M2 Taswira (county map) and M4 Tafuta (search).",
    )
    constituency: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
        doc="Constituency name (for MP candidates) or ward name (for MCA). "
            "NULL for county-wide and national positions.",
    )
    ward: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
        doc="Ward name (for MCA candidates only).",
    )

    # ── Financial Compliance ─────────────────────────────────────
    spending_limit: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        default=Decimal("0.00"),
        doc="IEBC-gazetted spending limit for this candidate's election type "
            "and electoral area (ECF Act s.18). Sourced from spending_limits table.",
    )
    total_contributions: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default="0.00",
        doc="Running total of all contributions received (KES). "
            "Updated on each new contribution. Used for s.12(2) single-source cap.",
    )
    total_expenditure: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        default=Decimal("0.00"),
        server_default="0.00",
        doc="Running total of all expenditures incurred (KES). "
            "Compared against spending_limit for compliance (ECF Act s.18).",
    )

    # ── Status ───────────────────────────────────────────────────
    status: Mapped[CandidateStatus] = mapped_column(
        ENUM(CandidateStatus, name="candidate_status_enum", create_type=True),
        nullable=False,
        default=CandidateStatus.NOMINATED,
        doc="Current lifecycle status. DISQUALIFIED per ECF Act s.23(3) "
            "or s.21(5)(f) if IEBC finds a breach.",
    )

    # ── IEBC Registration ────────────────────────────────────────
    iebc_registration_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
        doc="Date candidate was registered with IEBC as an authorised person "
            "(ECF Act s.6(5)).",
    )
    expenditure_account_number: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Campaign financing account number submitted to IEBC "
            "(ECF Act s.6(6)). Stored for audit trail.",
    )

    # ── Relationships ────────────────────────────────────────────
    party: Mapped[Optional["PoliticalParty"]] = relationship(
        "PoliticalParty",
        back_populates="candidates",
        doc="The political party sponsoring this candidate (NULL if independent).",
    )

    contributions: Mapped[List["Contribution"]] = relationship(
        "Contribution",
        back_populates="candidate",
        lazy="selectin",
        cascade="all, delete-orphan",
        doc="All contributions received by this candidate (ECF Act Part IV).",
    )

    expenditures: Mapped[List["Expenditure"]] = relationship(
        "Expenditure",
        back_populates="candidate",
        lazy="selectin",
        cascade="all, delete-orphan",
        doc="All expenditures incurred by this candidate (ECF Act Part III).",
    )

    incidents: Mapped[List["Incident"]] = relationship(
        "Incident",
        back_populates="candidate",
        lazy="selectin",
        doc="Incidents of alleged public resource misuse linked to this candidate.",
    )

    # ── Indexes & Constraints ────────────────────────────────────
    __table_args__ = (
        Index("ix_candidates_county", "county"),
        Index("ix_candidates_election_type", "election_type"),
        Index("ix_candidates_status", "status"),
        Index("ix_candidates_party_id", "party_id"),
        Index("ix_candidates_county_election", "county", "election_type"),
        Index("ix_candidates_name_trgm", "full_name", postgresql_using="gin",
              postgresql_ops={"full_name": "gin_trgm_ops"}),
        {"comment": "Candidates contesting elective posts. "
                     "ECF Act s.2, s.6, s.10, s.18, s.23."},
    )

    def __repr__(self) -> str:
        return (
            f"<Candidate(name='{self.full_name}', "
            f"type={self.election_type.value}, county='{self.county}')>"
        )

    @property
    def spending_utilisation_pct(self) -> float:
        """
        Percentage of the IEBC-gazetted spending limit consumed.
        Used in M1 Fedha Dashboard for compliance badges:
          - <80%  → status-compliant (green)
          - 80-99% → status-warning (amber)
          - ≥100% → status-violation (red) — potential ECF Act s.18 breach
        """
        if self.spending_limit and self.spending_limit > 0:
            return float((self.total_expenditure / self.spending_limit) * 100)
        return 0.0

    @property
    def is_over_limit(self) -> bool:
        """True if candidate has exceeded the IEBC spending limit (ECF Act s.18)."""
        return self.total_expenditure > self.spending_limit
