"""
UCHAGUZI SAFI — Expenditure Schemas
======================================
Pydantic v2 schemas for expenditure CRUD and category analytics.
Categories follow ECF Act s.19(a)-(f) EXACTLY.

Module mapping:
  - M1 Fedha Dashboard: Expenditure lists, category charts
  - M2 Taswira: Category-level visualisations
  - M5 Tahadhari: Alerts when spending approaches limits (s.18)
"""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

from app.models.expenditure import ExpenditureCategory


# ═══════════════════════════════════════════════════════════════════
# BASE / CREATE
# ═══════════════════════════════════════════════════════════════════

class ExpenditureBase(BaseModel):
    """Shared fields for expenditure creation and response."""

    candidate_id: UUID = Field(
        description="UUID of the candidate who incurred this expense.",
    )
    amount: Decimal = Field(
        gt=0,
        max_digits=15,
        decimal_places=2,
        description="Expenditure amount in KES. Contributes to spending limit check (s.18).",
        examples=[1500000.00],
    )
    category: ExpenditureCategory = Field(
        description="Authorised expenditure category per ECF Act s.19(a)-(f). "
                    "VENUE | PUBLICITY | ADVERTISING | PERSONNEL | TRANSPORT | OTHER.",
        examples=[ExpenditureCategory.ADVERTISING],
    )
    description: str = Field(
        min_length=5,
        description="Detailed description of the expenditure (s.26 record-keeping).",
        examples=["Radio advertisement on Citizen FM — 30 second spot, 14-day rotation"],
    )
    date_incurred: date = Field(
        description="Date the expense was incurred. Must fall within the expenditure period.",
        examples=["2027-06-20"],
    )


class ExpenditureCreate(ExpenditureBase):
    """Schema for recording a new expenditure."""

    vendor_name: Optional[str] = Field(
        default=None,
        max_length=300,
        description="Name of the vendor/service provider.",
        examples=["Royal Media Services Ltd"],
    )
    vendor_contact: Optional[str] = Field(
        default=None,
        max_length=300,
        description="Vendor contact details.",
        examples=["+254720000000"],
    )
    receipt_url: Optional[str] = Field(
        default=None,
        max_length=500,
        description="URL to the uploaded receipt/invoice.",
    )
    payment_method: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Payment method: CASH, BANK_TRANSFER, MPESA, CHEQUE, OTHER.",
        examples=["BANK_TRANSFER"],
    )
    reference_number: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Payment reference (e.g., M-Pesa ID, cheque number).",
        examples=["TXN-20270620-RMS-4521"],
    )

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        """Ensure category is one of the ECF Act s.19 authorised types."""
        if v not in ExpenditureCategory:
            raise ValueError(
                f"Invalid category. Must be one of the ECF Act s.19 "
                f"authorised categories: {[c.value for c in ExpenditureCategory]}"
            )
        return v


# ═══════════════════════════════════════════════════════════════════
# RESPONSE
# ═══════════════════════════════════════════════════════════════════

class ExpenditureResponse(ExpenditureBase):
    """Full expenditure response with verification status."""

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [{
                "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
                "amount": 1500000.00,
                "category": "ADVERTISING",
                "description": "Radio advertisement on Citizen FM",
                "date_incurred": "2027-06-20",
                "is_verified": True,
                "category_label": "Advertising for the campaigns",
            }]
        }
    )

    id: UUID
    vendor_name: Optional[str] = None
    vendor_contact: Optional[str] = None
    receipt_url: Optional[str] = None
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    is_verified: bool = False
    verified_by: Optional[str] = None
    verification_date: Optional[date] = None
    currency: str = "KES"
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def category_label(self) -> str:
        """
        Human-readable category label matching ECF Act s.19 wording.
        """
        labels = {
            ExpenditureCategory.VENUE: "Venue where campaign activities may be undertaken",
            ExpenditureCategory.PUBLICITY: "Publicity material for campaigns",
            ExpenditureCategory.ADVERTISING: "Advertising for the campaigns",
            ExpenditureCategory.PERSONNEL: "Campaign personnel",
            ExpenditureCategory.TRANSPORT: "Transportation in respect of campaign activities",
            ExpenditureCategory.OTHER: "Other justifiable expenses",
        }
        return labels.get(self.category, self.category.value)


class ExpenditureListItem(BaseModel):
    """Compact expenditure for list views."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    amount: Decimal
    category: ExpenditureCategory
    description: str
    date_incurred: date
    vendor_name: Optional[str] = None
    is_verified: bool = False


# ═══════════════════════════════════════════════════════════════════
# ANALYTICS
# ═══════════════════════════════════════════════════════════════════

class CategoryBreakdownItem(BaseModel):
    """Single category in the expenditure breakdown."""
    category: ExpenditureCategory = Field(examples=[ExpenditureCategory.ADVERTISING])
    category_label: str = Field(examples=["Advertising for the campaigns"])
    total_amount: Decimal = Field(examples=[8500000.00])
    percentage_of_total: float = Field(examples=[29.8])
    transaction_count: int = Field(examples=[42])
    average_transaction: Decimal = Field(examples=[202380.95])
    is_largest_category: bool = Field(
        default=False,
        description="True if this is the highest-spend category.",
    )


class ExpenditureBreakdown(BaseModel):
    """
    Expenditure analytics broken down by ECF Act s.19 categories.
    Drives the category donut chart in M1 Fedha Dashboard.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{
                "candidate_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
                "total_expenditure": 28500000.00,
                "spending_limit": 50000000.00,
                "spending_utilisation_pct": 57.0,
                "compliance_status": "COMPLIANT",
            }]
        }
    )

    candidate_id: UUID
    candidate_name: str
    total_expenditure: Decimal
    expenditure_count: int
    spending_limit: Decimal = Field(description="IEBC-gazetted limit (KES) per s.18.")
    spending_utilisation_pct: float
    compliance_status: str = Field(description="COMPLIANT / WARNING / VIOLATION.")
    remaining_budget: Decimal = Field(description="Spending limit minus total expenditure.")

    by_category: List[CategoryBreakdownItem] = Field(
        default_factory=list,
        description="Breakdown by the 6 ECF Act s.19 categories. "
                    "VENUE, PUBLICITY, ADVERTISING, PERSONNEL, TRANSPORT, OTHER.",
    )
    verified_total: Decimal = Field(
        default=Decimal("0.00"),
        description="Total KES of verified expenditures.",
    )
    unverified_total: Decimal = Field(
        default=Decimal("0.00"),
        description="Total KES of unverified expenditures.",
    )
    verification_rate_pct: float = Field(
        default=0.0,
        description="Percentage of expenditures verified by the expenditure committee.",
    )
