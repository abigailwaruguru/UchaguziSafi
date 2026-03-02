"""
UCHAGUZI SAFI — Candidate Schemas
====================================
Pydantic v2 schemas for candidate CRUD, financial summaries,
and comparison endpoints.

ECF Act references:
  - s.2:   Candidate and party candidate definitions
  - s.6:   Authorised persons registration with IEBC
  - s.12:  Contribution limits (single source ≤ 20%)
  - s.18:  IEBC-gazetted spending limits per election type
  - s.23:  Offences and disqualification

Module mapping:
  - M4 Tafuta:  Candidate search, profile, registry
  - M1 Fedha:   Financial dashboard, compliance badges
  - M2 Taswira:  Spending visualisation
"""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

from app.models.candidate import CandidateStatus, ElectionType


# ═══════════════════════════════════════════════════════════════════
# BASE / CREATE / UPDATE
# ═══════════════════════════════════════════════════════════════════

class CandidateBase(BaseModel):
    """Shared fields for candidate creation and response."""

    full_name: str = Field(
        min_length=2,
        max_length=300,
        description="Full legal name of the candidate.",
        examples=["Amina Wanjiku Odhiambo"],
    )
    election_type: ElectionType = Field(
        description="Type of elective post being contested. "
                    "Determines applicable IEBC spending limits (ECF Act s.18).",
        examples=[ElectionType.GOVERNOR],
    )
    county: str = Field(
        min_length=2,
        max_length=100,
        description="One of Kenya's 47 counties.",
        examples=["Nairobi"],
    )
    constituency: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Constituency (for MP) or ward (for MCA). "
                    "NULL for county-wide and national positions.",
        examples=["Westlands"],
    )
    ward: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Ward name (MCA candidates only).",
        examples=["Kangemi"],
    )
    party_id: Optional[UUID] = Field(
        default=None,
        description="FK to political party. NULL for independent candidates "
                    "(who form a 3-member expenditure committee per ECF Act s.8).",
    )
    is_independent: bool = Field(
        default=False,
        description="True if candidate is independent (not party-sponsored).",
    )
    bio: Optional[str] = Field(
        default=None,
        description="Brief biography or campaign platform summary.",
        examples=["Experienced county administrator with a focus on healthcare."],
    )
    photo_url: Optional[str] = Field(
        default=None,
        max_length=500,
        description="URL to candidate photo.",
    )


class CandidateCreate(CandidateBase):
    """Schema for registering a new candidate in the system."""

    spending_limit: Decimal = Field(
        gt=0,
        max_digits=15,
        decimal_places=2,
        description="IEBC-gazetted spending limit in KES for this candidate's "
                    "election type and electoral area (ECF Act s.18).",
        examples=[50000000.00],
    )
    iebc_registration_date: Optional[date] = Field(
        default=None,
        description="Date registered with IEBC as an authorised person (s.6(5)).",
        examples=["2026-06-15"],
    )
    expenditure_account_number: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Campaign financing account number submitted to IEBC (s.6(6)).",
        examples=["0123456789-KCB"],
    )

    @field_validator("party_id")
    @classmethod
    def validate_independent_party(cls, v, info):
        """Independent candidates must not have a party_id."""
        if info.data.get("is_independent") and v is not None:
            raise ValueError(
                "Independent candidates (ECF Act s.8) must not have a party_id."
            )
        return v


class CandidateUpdate(BaseModel):
    """Schema for partial updates to a candidate record."""
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=300)
    photo_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = Field(default=None)
    status: Optional[CandidateStatus] = Field(default=None)
    spending_limit: Optional[Decimal] = Field(default=None, gt=0)


# ═══════════════════════════════════════════════════════════════════
# RESPONSE
# ═══════════════════════════════════════════════════════════════════

class CandidateResponse(CandidateBase):
    """
    Full candidate response with financial compliance data.
    Displayed on M4 Tafuta candidate profile and M1 Fedha dashboard.
    """

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [{
                "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
                "full_name": "Amina Wanjiku Odhiambo",
                "election_type": "GOVERNOR",
                "county": "Nairobi",
                "status": "ACTIVE",
                "spending_limit": 50000000.00,
                "total_contributions": 32000000.00,
                "total_expenditure": 28500000.00,
                "spending_utilisation_pct": 57.0,
                "compliance_status": "COMPLIANT",
                "party_name": "Orange Democratic Movement",
                "party_abbreviation": "ODM",
            }]
        }
    )

    id: UUID
    status: CandidateStatus
    spending_limit: Decimal = Field(description="IEBC-gazetted spending limit (KES).")
    total_contributions: Decimal = Field(description="Total contributions received (KES).")
    total_expenditure: Decimal = Field(description="Total expenditure incurred (KES).")
    iebc_registration_date: Optional[date] = None
    expenditure_account_number: Optional[str] = None

    # Denormalised party fields for display
    party_name: Optional[str] = Field(
        default=None,
        description="Party name (denormalised for display convenience).",
    )
    party_abbreviation: Optional[str] = Field(
        default=None,
        description="Party abbreviation.",
    )

    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def spending_utilisation_pct(self) -> float:
        """
        Percentage of IEBC spending limit consumed.
        Used for compliance badges in M1 Fedha Dashboard:
          <80%  → COMPLIANT (green)
          80-99% → WARNING (amber)
          ≥100% → VIOLATION (red)
        """
        if self.spending_limit and self.spending_limit > 0:
            return round(float(self.total_expenditure / self.spending_limit * 100), 1)
        return 0.0

    @computed_field
    @property
    def compliance_status(self) -> str:
        """
        ECF Act s.18 compliance status derived from spending utilisation.
        Drives the status badges in the frontend Tailwind config:
          - status-compliant (#006600)
          - status-warning (#F57F17)
          - status-violation (#BB0000)
        """
        pct = self.spending_utilisation_pct
        if pct >= 100:
            return "VIOLATION"
        elif pct >= 80:
            return "WARNING"
        return "COMPLIANT"


class CandidateListItem(BaseModel):
    """Compact candidate for list views (M4 Tafuta search results)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    election_type: ElectionType
    county: str
    constituency: Optional[str] = None
    status: CandidateStatus
    party_name: Optional[str] = None
    party_abbreviation: Optional[str] = None
    photo_url: Optional[str] = None
    total_expenditure: Decimal = Decimal("0.00")
    spending_limit: Decimal = Decimal("0.00")

    @computed_field
    @property
    def spending_utilisation_pct(self) -> float:
        if self.spending_limit and self.spending_limit > 0:
            return round(float(self.total_expenditure / self.spending_limit * 100), 1)
        return 0.0

    @computed_field
    @property
    def compliance_status(self) -> str:
        pct = self.spending_utilisation_pct
        if pct >= 100:
            return "VIOLATION"
        elif pct >= 80:
            return "WARNING"
        return "COMPLIANT"


# ═══════════════════════════════════════════════════════════════════
# FINANCE SUMMARY (M1 Fedha Dashboard)
# ═══════════════════════════════════════════════════════════════════

class TopContributor(BaseModel):
    """A top contributor to a candidate's campaign."""
    contributor_name: str = Field(examples=["Kenya Business Council"])
    total_amount: Decimal = Field(examples=[5000000.00])
    source_type: str = Field(examples=["CORPORATE"])
    contribution_count: int = Field(examples=[3])
    percentage_of_total: float = Field(
        description="Percentage of total contributions. "
                    "ECF Act s.12(2): Must not exceed 20% from a single source.",
        examples=[15.6],
    )
    exceeds_single_source_cap: bool = Field(
        default=False,
        description="True if this contributor exceeds the 20% single-source cap (s.12(2)).",
    )


class CategoryBreakdown(BaseModel):
    """Expenditure breakdown by ECF Act s.19 category."""
    category: str = Field(examples=["ADVERTISING"])
    total_amount: Decimal = Field(examples=[8500000.00])
    percentage_of_total: float = Field(examples=[29.8])
    transaction_count: int = Field(examples=[42])


class CandidateFinanceSummary(BaseModel):
    """
    Comprehensive financial summary for a candidate.
    Populates the M1 Fedha Dashboard candidate detail view.
    Embeds ECF Act compliance checks.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{
                "candidate_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
                "candidate_name": "Amina Wanjiku Odhiambo",
                "election_type": "GOVERNOR",
                "county": "Nairobi",
                "spending_limit": 50000000.00,
                "total_contributions": 32000000.00,
                "total_expenditure": 28500000.00,
                "compliance_status": "COMPLIANT",
            }]
        }
    )

    # Identity
    candidate_id: UUID
    candidate_name: str
    election_type: ElectionType
    county: str
    party_name: Optional[str] = None

    # Financial totals
    spending_limit: Decimal = Field(description="IEBC-gazetted limit (KES).")
    total_contributions: Decimal = Field(description="Total contributions received (KES).")
    total_expenditure: Decimal = Field(description="Total expenditure incurred (KES).")
    remaining_budget: Decimal = Field(description="Spending limit minus total expenditure (KES).")
    spending_utilisation_pct: float = Field(description="Percentage of limit consumed.")
    compliance_status: str = Field(description="COMPLIANT / WARNING / VIOLATION.")

    # Contribution analysis
    contribution_count: int = Field(description="Number of individual contributions.")
    top_contributors: List[TopContributor] = Field(
        default_factory=list,
        description="Top contributors ranked by total amount. "
                    "Flagged if exceeding s.12(2) 20% cap.",
    )
    anonymous_contribution_count: int = Field(
        default=0,
        description="Number of anonymous contributions (prohibited under s.13).",
    )
    anonymous_contribution_total: Decimal = Field(
        default=Decimal("0.00"),
        description="Total KES from anonymous sources (must be reported to IEBC).",
    )

    # Expenditure analysis
    expenditure_count: int = Field(description="Number of expenditure transactions.")
    expenditure_by_category: List[CategoryBreakdown] = Field(
        default_factory=list,
        description="Breakdown by ECF Act s.19 categories.",
    )


# ═══════════════════════════════════════════════════════════════════
# CANDIDATE COMPARISON
# ═══════════════════════════════════════════════════════════════════

class CandidateComparisonItem(BaseModel):
    """A single candidate's data in a comparison view."""
    candidate_id: UUID
    candidate_name: str
    party_name: Optional[str] = None
    party_abbreviation: Optional[str] = None
    total_contributions: Decimal
    total_expenditure: Decimal
    spending_limit: Decimal
    spending_utilisation_pct: float
    compliance_status: str
    contribution_count: int
    expenditure_count: int
    top_category: Optional[str] = Field(
        default=None,
        description="Highest-spend ECF Act s.19 category.",
    )
    top_category_amount: Optional[Decimal] = None


class CandidateComparison(BaseModel):
    """
    Side-by-side comparison of two candidates' finances.
    Used in M1 Fedha Dashboard comparison view and M2 Taswira.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{
                "election_type": "GOVERNOR",
                "county": "Nairobi",
                "candidates": [],
            }]
        }
    )

    election_type: ElectionType
    county: str
    candidates: List[CandidateComparisonItem] = Field(
        min_length=2,
        max_length=10,
        description="Candidates being compared (2-10).",
    )
