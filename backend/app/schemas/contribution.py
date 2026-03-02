"""
UCHAGUZI SAFI — Contribution Schemas
=======================================
Pydantic v2 schemas for contribution CRUD and analytics.
Validates against ECF Act Part IV requirements:
  - s.11:  Lawful sources only
  - s.12:  Single-source ≤ 20% of total
  - s.13:  Anonymous contributions flagged for IEBC reporting
  - s.14:  Public resource contributions prohibited
  - s.16:  Receipts for > KES 20,000; harambee record-keeping

Module mapping:
  - M1 Fedha Dashboard: Contribution lists, summaries
  - M5 Tahadhari: Alerts for compliance breaches
"""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator

from app.models.contribution import ContributionSourceType


# ═══════════════════════════════════════════════════════════════════
# BASE / CREATE
# ═══════════════════════════════════════════════════════════════════

class ContributionBase(BaseModel):
    """Shared fields for contribution creation and response."""

    candidate_id: UUID = Field(
        description="UUID of the candidate receiving this contribution.",
    )
    amount: Decimal = Field(
        gt=0,
        max_digits=15,
        decimal_places=2,
        description="Contribution amount in KES. "
                    "If > 20,000, contributor_name is required (ECF Act s.16(1)).",
        examples=[250000.00],
    )
    source_type: ContributionSourceType = Field(
        description="Classification per ECF Act s.11. "
                    "HARAMBEE requires additional fields (s.16(2)).",
        examples=[ContributionSourceType.INDIVIDUAL],
    )
    date_received: date = Field(
        description="Date the contribution was received.",
        examples=["2027-04-15"],
    )


class ContributionCreate(ContributionBase):
    """
    Schema for recording a new contribution.
    Includes ECF Act validation:
      - s.16(1): contributor_name required when amount > KES 20,000
      - s.16(2): harambee fields required when source_type = HARAMBEE
      - s.13:    anonymous flag triggers IEBC reporting requirement
    """

    # Contributor identity (s.26(1)(b))
    contributor_name: Optional[str] = Field(
        default=None,
        max_length=300,
        description="Contributor name. REQUIRED when amount > KES 20,000 (s.16(1)).",
        examples=["Grace Nyambura Karanja"],
    )
    contributor_id_number: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Contributor ID/passport number (stored encrypted).",
    )
    contributor_email: Optional[str] = Field(
        default=None,
        max_length=254,
        description="Contributor email (s.26(1)(b)).",
    )
    contributor_phone: Optional[str] = Field(
        default=None,
        max_length=20,
        description="Contributor phone number.",
        examples=["+254712345678"],
    )
    contributor_postal_address: Optional[str] = Field(default=None, max_length=300)
    contributor_physical_address: Optional[str] = Field(default=None, max_length=500)

    # Transaction details
    receipt_number: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Receipt number. Mandatory when amount > KES 20,000 (s.16(1)).",
        examples=["REC-2027-00142"],
    )
    description: Optional[str] = Field(
        default=None,
        description="Description or notes about the contribution.",
    )

    # Compliance flags
    is_anonymous: bool = Field(
        default=False,
        description="ECF Act s.13: If True, must be reported to IEBC within 14 days.",
    )
    is_from_public_resource: bool = Field(
        default=False,
        description="ECF Act s.14: If True, PROHIBITED — report within 48 hours.",
    )

    # Harambee-specific (s.16(2))
    harambee_venue: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Venue of the harambee (required when source_type = HARAMBEE).",
        examples=["Uhuru Gardens, Nairobi"],
    )
    harambee_date: Optional[date] = Field(
        default=None,
        description="Date of the harambee event.",
        examples=["2027-04-10"],
    )
    harambee_organiser: Optional[str] = Field(
        default=None,
        max_length=300,
        description="Name of the harambee organiser.",
        examples=["Friends of Amina Committee"],
    )
    harambee_total_collected: Optional[Decimal] = Field(
        default=None,
        gt=0,
        description="Total amount collected at the harambee.",
        examples=[1500000.00],
    )

    # Non-monetary contributions (s.2 definition)
    is_non_monetary: bool = Field(
        default=False,
        description="True if this is a non-monetary contribution (s.2). "
                    "Amount field holds the market value.",
    )
    non_monetary_description: Optional[str] = Field(
        default=None,
        description="Description of non-monetary contribution.",
        examples=["Office space at Westlands, Nairobi — market rent KES 250,000/month"],
    )

    @model_validator(mode="after")
    def validate_ecf_act_rules(self):
        """
        Cross-field validation implementing ECF Act provisions.
        """
        # s.16(1): Contributor name required for contributions > KES 20,000
        if self.amount > Decimal("20000") and not self.contributor_name:
            raise ValueError(
                "ECF Act s.16(1): contributor_name is required for "
                "contributions exceeding KES 20,000."
            )

        # s.16(2): Harambee contributions require venue, date, organiser
        if self.source_type == ContributionSourceType.HARAMBEE:
            missing = []
            if not self.harambee_venue:
                missing.append("harambee_venue")
            if not self.harambee_date:
                missing.append("harambee_date")
            if not self.harambee_organiser:
                missing.append("harambee_organiser")
            if missing:
                raise ValueError(
                    f"ECF Act s.16(2): Harambee contributions require "
                    f"the following fields: {', '.join(missing)}."
                )

        # s.2: Non-monetary contributions require description
        if self.is_non_monetary and not self.non_monetary_description:
            raise ValueError(
                "ECF Act s.2: Non-monetary contributions require "
                "a non_monetary_description with market value justification."
            )

        return self


# ═══════════════════════════════════════════════════════════════════
# RESPONSE
# ═══════════════════════════════════════════════════════════════════

class ContributionResponse(ContributionBase):
    """Full contribution response with compliance computed fields."""

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [{
                "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
                "amount": 250000.00,
                "source_type": "INDIVIDUAL",
                "contributor_name": "Grace Nyambura Karanja",
                "is_anonymous": False,
                "requires_receipt": True,
                "requires_iebc_report": False,
            }]
        }
    )

    id: UUID
    contributor_name: Optional[str] = None
    contributor_email: Optional[str] = None
    contributor_phone: Optional[str] = None
    receipt_number: Optional[str] = None
    description: Optional[str] = None

    # Compliance flags
    is_anonymous: bool = False
    is_from_illegal_source: bool = False
    is_from_public_resource: bool = False
    reported_to_iebc: bool = False
    iebc_report_date: Optional[datetime] = None

    # Harambee fields
    harambee_venue: Optional[str] = None
    harambee_date: Optional[date] = None
    harambee_organiser: Optional[str] = None
    harambee_total_collected: Optional[Decimal] = None

    # Non-monetary
    is_non_monetary: bool = False
    non_monetary_description: Optional[str] = None

    currency: str = "KES"
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def requires_receipt(self) -> bool:
        """ECF Act s.16(1): Receipts required for contributions > KES 20,000."""
        return self.amount > Decimal("20000")

    @computed_field
    @property
    def requires_iebc_report(self) -> bool:
        """Whether this contribution must be reported to IEBC."""
        return self.is_anonymous or self.is_from_illegal_source or self.is_from_public_resource


class ContributionListItem(BaseModel):
    """Compact contribution for list views."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    amount: Decimal
    source_type: ContributionSourceType
    contributor_name: Optional[str] = None
    date_received: date
    is_anonymous: bool = False
    is_from_public_resource: bool = False
    receipt_number: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════
# ANALYTICS
# ═══════════════════════════════════════════════════════════════════

class SourceTypeBreakdown(BaseModel):
    """Contribution breakdown by source type (ECF Act s.11)."""
    source_type: ContributionSourceType = Field(examples=[ContributionSourceType.INDIVIDUAL])
    total_amount: Decimal = Field(examples=[15000000.00])
    percentage_of_total: float = Field(examples=[46.9])
    transaction_count: int = Field(examples=[128])


class ContributionBreakdown(BaseModel):
    """
    Aggregate contribution analytics for M1 Fedha Dashboard.
    Breaks down contributions by source type per ECF Act s.11.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{
                "candidate_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
                "total_contributions": 32000000.00,
                "contribution_count": 245,
            }]
        }
    )

    candidate_id: UUID
    candidate_name: str
    total_contributions: Decimal
    contribution_count: int
    by_source_type: List[SourceTypeBreakdown] = Field(
        default_factory=list,
        description="Breakdown by ECF Act s.11 source categories.",
    )
    anonymous_count: int = Field(
        default=0,
        description="Count of anonymous contributions (s.13 violations).",
    )
    anonymous_total: Decimal = Field(
        default=Decimal("0.00"),
        description="Total KES from anonymous sources.",
    )
    public_resource_count: int = Field(
        default=0,
        description="Count of public resource contributions (s.14 violations).",
    )
    largest_single_source_pct: float = Field(
        default=0.0,
        description="Largest single-source as % of total. "
                    "s.12(2): Must not exceed 20%.",
    )
    single_source_cap_breached: bool = Field(
        default=False,
        description="True if any single source exceeds the 20% cap (s.12(2)).",
    )
