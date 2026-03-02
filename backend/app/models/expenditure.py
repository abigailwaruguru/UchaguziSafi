"""
UCHAGUZI SAFI — Expenditure Model
====================================
Represents a campaign expense incurred by a candidate, regulated
under ECF Act Part III (Regulation of Expenditure).

ECF Act references:
  - s.2:   "campaign expenses" and "election expenses" definitions
  - s.5:   IEBC makes rules to regulate campaign financing
  - s.10:  Expenditure report submission (21-day preliminary, 3-month final)
  - s.18:  Spending limits — IEBC prescribes by gazette notice
  - s.19:  Authorised expenditure categories (EXACTLY 6):
           venue, publicity, advertising, personnel, transportation,
           and "any other justifiable expenses"
  - s.26:  Records of funds spent must be kept

Module mapping:
  - M1 Fedha Dashboard: Expenditure breakdown by category
  - M2 Taswira: Category-level visualisations
  - M5 Tahadhari: Alerts when spending approaches/exceeds limits (s.18)
"""

import enum
import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean, CheckConstraint, Date, ForeignKey, Index,
    Numeric, String, Text,
)
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.candidate import Candidate


# ═══════════════════════════════════════════════════════════════════
# ENUMERATIONS
# ═══════════════════════════════════════════════════════════════════

class ExpenditureCategory(str, enum.Enum):
    """
    Authorised expenditure categories per ECF Act s.19 (a)–(f).
    These are the EXACT categories the IEBC prescribes by gazette notice.

    s.19: The Commission shall prescribe the nature of authorised items
    or activities for which campaign expenses may be incurred, including:
      (a) venue where campaign activities may be undertaken
      (b) publicity material for campaigns
      (c) advertising for the campaigns
      (d) campaign personnel
      (e) transportation in respect of campaign activities
      (f) any other justifiable expenses
    """
    VENUE = "VENUE"                 # s.19(a) — rally grounds, halls, fields
    PUBLICITY = "PUBLICITY"         # s.19(b) — posters, flyers, merchandise
    ADVERTISING = "ADVERTISING"     # s.19(c) — media ads, billboards, digital
    PERSONNEL = "PERSONNEL"         # s.19(d) — campaign staff, agents
    TRANSPORT = "TRANSPORT"         # s.19(e) — vehicles, fuel, logistics
    OTHER = "OTHER"                 # s.19(f) — any other justifiable expenses


# ═══════════════════════════════════════════════════════════════════
# MODEL
# ═══════════════════════════════════════════════════════════════════

class Expenditure(BaseModel):
    __tablename__ = "expenditures"

    # ── Candidate Link ───────────────────────────────────────────
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        doc="FK to the candidate who incurred this expense.",
    )

    # ── Financial Details ────────────────────────────────────────
    amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        doc="Expenditure amount in KES. Contributes to the candidate's "
            "total_expenditure, checked against spending_limit (ECF Act s.18).",
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="KES",
        server_default="KES",
        doc="Currency code. Always KES for Kenyan elections.",
    )

    # ── Category (ECF Act s.19) ──────────────────────────────────
    category: Mapped[ExpenditureCategory] = mapped_column(
        ENUM(ExpenditureCategory, name="expenditure_category_enum", create_type=True),
        nullable=False,
        doc="Authorised expenditure category per ECF Act s.19(a)-(f). "
            "Used for category-level analytics in M1 Fedha Dashboard.",
    )

    # ── Description & Vendor ─────────────────────────────────────
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Detailed description of the expenditure. "
            "Required for audit trail (ECF Act s.26).",
    )
    vendor_name: Mapped[Optional[str]] = mapped_column(
        String(300),
        nullable=True,
        doc="Name of the vendor/service provider paid.",
    )
    vendor_contact: Mapped[Optional[str]] = mapped_column(
        String(300),
        nullable=True,
        doc="Vendor contact information (phone, email, or address).",
    )

    # ── Transaction Details ──────────────────────────────────────
    date_incurred: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        doc="Date the expense was incurred. Must fall within the "
            "IEBC-defined expenditure period (ECF Act s.2).",
    )
    receipt_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="URL to the uploaded receipt/invoice image or document.",
    )
    payment_method: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Payment method: CASH, BANK_TRANSFER, MPESA, CHEQUE, OTHER.",
    )
    reference_number: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Payment reference (e.g., M-Pesa transaction ID, cheque number).",
    )

    # ── Verification ─────────────────────────────────────────────
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
        doc="Whether this expenditure has been verified by the expenditure "
            "committee (ECF Act s.7(4)(f) — party, or s.8(3)(e) — independent).",
    )
    verified_by: Mapped[Optional[str]] = mapped_column(
        String(300),
        nullable=True,
        doc="Name of the expenditure committee member who verified this record.",
    )
    verification_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
        doc="Date this expenditure was verified.",
    )

    # ── Relationships ────────────────────────────────────────────
    candidate: Mapped["Candidate"] = relationship(
        "Candidate",
        back_populates="expenditures",
        doc="The candidate who incurred this expense.",
    )

    # ── Indexes & Constraints ────────────────────────────────────
    __table_args__ = (
        Index("ix_expenditures_candidate_id", "candidate_id"),
        Index("ix_expenditures_category", "category"),
        Index("ix_expenditures_date_incurred", "date_incurred"),
        Index("ix_expenditures_is_verified", "is_verified"),
        Index("ix_expenditures_candidate_category", "candidate_id", "category"),

        # Amount must be positive
        CheckConstraint("amount > 0", name="ck_expenditures_amount_positive"),

        {"comment": "Campaign expenditures per ECF Act Part III (s.5-10). "
                     "Categories follow s.19(a)-(f) EXACTLY."},
    )

    def __repr__(self) -> str:
        return (
            f"<Expenditure(amount=KES {self.amount:,.2f}, "
            f"category={self.category.value}, date={self.date_incurred})>"
        )
