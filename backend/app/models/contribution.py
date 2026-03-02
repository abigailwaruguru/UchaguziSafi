"""
UCHAGUZI SAFI — Contribution Model
=====================================
Represents a financial contribution to a candidate's campaign,
regulated under ECF Act Part IV (Contributions and Donations).

ECF Act references:
  - s.11:  Lawful sources: persons, political parties, harambees
           (NOT directly from foreign governments)
  - s.12:  Contribution limits: no single source > 20% of total;
           IEBC prescribes disclosure thresholds
  - s.13:  Anonymous contributions prohibited — must be reported
           to IEBC within 14 days and submitted to Commission
  - s.14:  State/public resource contributions prohibited
  - s.15:  Supporting organisations must register with IEBC
  - s.16:  Receipts required for contributions > KES 20,000;
           harambee records must include venue, date, organiser
  - s.17:  Surplus funds must be disposed within 3 months

Module mapping:
  - M1 Fedha Dashboard: Contribution summaries, source breakdowns
  - M2 Taswira: Contribution flow visualisations
  - M5 Tahadhari: Alerts when s.12(2) 20% cap is breached
"""

import enum
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index,
    Numeric, String, Text, func,
)
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.candidate import Candidate


# ═══════════════════════════════════════════════════════════════════
# ENUMERATIONS
# ═══════════════════════════════════════════════════════════════════

class ContributionSourceType(str, enum.Enum):
    """
    Lawful sources of campaign finance per ECF Act s.11.
    HARAMBEE has additional record-keeping requirements (s.16(2)).
    """
    INDIVIDUAL = "INDIVIDUAL"           # Natural person
    CORPORATE = "CORPORATE"             # Company or organisation
    HARAMBEE = "HARAMBEE"               # Public collection (s.11(c), s.16(2))
    SELF_FUNDING = "SELF_FUNDING"       # Candidate's own funds (s.12(2) exemption)
    POLITICAL_PARTY = "POLITICAL_PARTY" # Party contribution (s.11(a))
    ORGANISATION = "ORGANISATION"       # Registered supporting org (s.15)


# ═══════════════════════════════════════════════════════════════════
# MODEL
# ═══════════════════════════════════════════════════════════════════

class Contribution(BaseModel):
    __tablename__ = "contributions"

    # ── Candidate Link ───────────────────────────────────────────
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        doc="FK to the candidate receiving this contribution.",
    )

    # ── Financial Details ────────────────────────────────────────
    amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        doc="Contribution amount in KES. "
            "If > KES 20,000, contributor_name is required (ECF Act s.16(1)).",
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="KES",
        server_default="KES",
        doc="Currency code. Always KES for Kenyan elections.",
    )

    # ── Source Classification ────────────────────────────────────
    source_type: Mapped[ContributionSourceType] = mapped_column(
        ENUM(ContributionSourceType, name="contribution_source_enum", create_type=True),
        nullable=False,
        doc="Classification of the contribution source per ECF Act s.11. "
            "Determines applicable validation rules.",
    )

    # ── Contributor Identity ─────────────────────────────────────
    # ECF Act s.16(1): Receipt required for contributions > KES 20,000
    # ECF Act s.26(1)(b): Records must include names, addresses of contributors
    contributor_name: Mapped[Optional[str]] = mapped_column(
        String(300),
        nullable=True,
        doc="Name of the contributor. REQUIRED when amount > KES 20,000 "
            "(ECF Act s.16(1)). May be NULL for small contributions.",
    )
    contributor_id_number: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="Contributor's ID/passport number. Stored encrypted. "
            "Used for single-source cap verification (s.12(2)).",
    )
    contributor_email: Mapped[Optional[str]] = mapped_column(
        String(254),
        nullable=True,
        doc="Contributor's email address (ECF Act s.26(1)(b): electronic addresses).",
    )
    contributor_phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        doc="Contributor's phone number.",
    )
    contributor_postal_address: Mapped[Optional[str]] = mapped_column(
        String(300),
        nullable=True,
        doc="Contributor's postal address (ECF Act s.26(1)(b)).",
    )
    contributor_physical_address: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="Contributor's physical address (ECF Act s.26(1)(b)).",
    )

    # ── Transaction Details ──────────────────────────────────────
    date_received: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        server_default=func.current_date(),
        doc="Date the contribution was received.",
    )
    receipt_number: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Receipt number issued for this contribution. "
            "Mandatory when amount > KES 20,000 (ECF Act s.16(1)).",
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Description or notes about the contribution.",
    )

    # ── Compliance Flags ─────────────────────────────────────────
    is_anonymous: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
        doc="ECF Act s.13: Anonymous contributions are PROHIBITED. "
            "If True, this contribution must be reported to IEBC within 14 days "
            "and submitted to the Commission.",
    )
    is_from_illegal_source: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
        doc="ECF Act s.13(1)(b): Flagged if from an unlawful source. "
            "Must be reported to IEBC within 14 days.",
    )
    is_from_public_resource: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
        doc="ECF Act s.14: Contributions from the State, state institutions, "
            "or public resources are PROHIBITED. Must be reported within 48 hours.",
    )
    reported_to_iebc: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
        doc="Whether flagged contributions (anonymous/illegal/public) "
            "have been reported to IEBC as required.",
    )
    iebc_report_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Date/time the contribution was reported to IEBC.",
    )

    # ── Harambee-Specific Fields (ECF Act s.16(2)) ───────────────
    # "harambee" defined in s.2 as "public collection of monies or other
    # property in aid support of an election or referendum campaign"
    harambee_venue: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="Venue of the harambee event (ECF Act s.16(2)). "
            "Required when source_type = HARAMBEE.",
    )
    harambee_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
        doc="Date of the harambee event (ECF Act s.16(2)).",
    )
    harambee_organiser: Mapped[Optional[str]] = mapped_column(
        String(300),
        nullable=True,
        doc="Name of the harambee organiser (ECF Act s.16(2)).",
    )
    harambee_total_collected: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(15, 2),
        nullable=True,
        doc="Total contributions collected at the harambee event (ECF Act s.16(2)).",
    )

    # ── Non-Monetary Contributions ───────────────────────────────
    is_non_monetary: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
        doc="ECF Act s.2: 'non-monetary contribution' means market value of "
            "services (other than volunteer labour) or property provided at "
            "less than market value. Amount field holds the market value.",
    )
    non_monetary_description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Description of non-monetary contribution (e.g., office space, vehicles).",
    )

    # ── Relationships ────────────────────────────────────────────
    candidate: Mapped["Candidate"] = relationship(
        "Candidate",
        back_populates="contributions",
        doc="The candidate who received this contribution.",
    )

    # ── Indexes & Constraints ────────────────────────────────────
    __table_args__ = (
        # Core query indexes
        Index("ix_contributions_candidate_id", "candidate_id"),
        Index("ix_contributions_source_type", "source_type"),
        Index("ix_contributions_date_received", "date_received"),
        Index("ix_contributions_is_anonymous", "is_anonymous"),
        Index("ix_contributions_candidate_source", "candidate_id", "source_type"),

        # Amount must be positive
        CheckConstraint("amount > 0", name="ck_contributions_amount_positive"),

        # Harambee fields required when source_type is HARAMBEE
        # (enforced at application layer for flexibility, documented here)
        {"comment": "Campaign contributions per ECF Act Part IV (s.11-17). "
                     "Anonymous/illegal/public resource contributions are "
                     "flagged for mandatory IEBC reporting."},
    )

    def __repr__(self) -> str:
        return (
            f"<Contribution(amount=KES {self.amount:,.2f}, "
            f"source={self.source_type.value}, "
            f"anonymous={self.is_anonymous})>"
        )

    @property
    def requires_receipt(self) -> bool:
        """ECF Act s.16(1): Receipts required for contributions > KES 20,000."""
        return self.amount > Decimal("20000")

    @property
    def requires_iebc_report(self) -> bool:
        """Whether this contribution must be reported to IEBC."""
        return self.is_anonymous or self.is_from_illegal_source or self.is_from_public_resource
