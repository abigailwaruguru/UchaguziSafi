"""
UCHAGUZI SAFI — Spending Limit Model
=======================================
Stores IEBC-gazetted spending limits per election type and
electoral area, as prescribed under ECF Act s.18.

ECF Act references:
  - s.18(1): IEBC prescribes spending limits by gazette notice
             at least 12 months before an election
  - s.18(3): IEBC may vary limits by gazette notice
  - s.18(4): Factors for determining limits:
             (a) geographical features and urban centres
             (b) the type of election
             (c) the population in an electoral area
             (d) the number of party members in an electoral area
             (e) the communication infrastructure in an electoral area
  - s.18(6): Overspending due to unforeseeable circumstances
             must be reported with justification

Module mapping:
  - M1 Fedha Dashboard: Spending limit bar per candidate
  - M5 Tahadhari: Alert triggers at 80% and 100% of limit
"""

import enum
from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    CheckConstraint, Date, Index, Numeric, String, Text,
)
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel
from app.models.candidate import ElectionType


class SpendingLimit(BaseModel):
    __tablename__ = "spending_limits"

    # ── Election Scope ───────────────────────────────────────────
    election_type: Mapped[ElectionType] = mapped_column(
        ENUM(ElectionType, name="election_type_enum", create_type=False),
        nullable=False,
        doc="Type of elective post this limit applies to. "
            "Determined by IEBC per ECF Act s.18(4)(b).",
    )
    county: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Kenya county this limit applies to. "
            "NULL for PRESIDENTIAL (national limit). "
            "Specific county for GOVERNOR, SENATOR, WOMEN_REP, MP, MCA. "
            "Limits may vary by county per s.18(4)(a) geographical factors.",
    )
    constituency: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True,
        doc="Constituency this limit applies to (for MP-level limits). "
            "NULL for county-wide and national positions.",
    )

    # ── Limit Amount ─────────────────────────────────────────────
    amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        doc="Maximum spending limit in KES as gazetted by IEBC. "
            "Candidates exceeding this without justification commit "
            "an offence under ECF Act s.23(1)(d).",
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="KES",
        server_default="KES",
        doc="Currency code. Always KES.",
    )

    # ── Gazette Reference ────────────────────────────────────────
    gazetted_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        doc="Date the spending limit was published in the Kenya Gazette. "
            "Must be at least 12 months before a general election (s.18(1)).",
    )
    gazette_reference: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        doc="Kenya Gazette notice reference (e.g., 'Vol. CXXVIII—No. 45'). "
            "Provides legal traceability.",
    )

    # ── IEBC Determination Factors (ECF Act s.18(4)) ─────────────
    population: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        doc="Population of the electoral area (s.18(4)(c)). "
            "Used by IEBC to determine the limit.",
    )
    geographical_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Notes on geographical features and urban centres (s.18(4)(a)) "
            "that influenced the limit determination.",
    )

    # ── Status ───────────────────────────────────────────────────
    is_current: Mapped[bool] = mapped_column(
        default=True,
        server_default="true",
        nullable=False,
        doc="Whether this is the currently active limit. "
            "Set to False when IEBC varies the limit (s.18(3)).",
    )

    # ── Indexes & Constraints ────────────────────────────────────
    __table_args__ = (
        Index("ix_spending_limits_election_type", "election_type"),
        Index("ix_spending_limits_county", "county"),
        Index("ix_spending_limits_is_current", "is_current"),
        Index("ix_spending_limits_type_county", "election_type", "county"),

        # Limit must be positive
        CheckConstraint("amount > 0", name="ck_spending_limits_amount_positive"),

        {"comment": "IEBC-gazetted spending limits per ECF Act s.18. "
                     "Varied by election type, county, and constituency."},
    )

    def __repr__(self) -> str:
        county_str = self.county or "NATIONAL"
        return (
            f"<SpendingLimit(type={self.election_type.value}, "
            f"county={county_str}, amount=KES {self.amount:,.2f})>"
        )