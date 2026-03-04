"""
UCHAGUZI SAFI — Visualisation Schemas
========================================
Pydantic v2 schemas for the M2 Taswira (Data Visualisation) module.
These define the data shapes consumed by Recharts and React Map GL
on the frontend.

Module mapping:
  - M2 Taswira: County spending map, spending timelines,
    party comparisons, category breakdowns
  - M1 Fedha Dashboard: Summary cards and charts
"""

import datetime as _dt
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ═══════════════════════════════════════════════════════════════════
# COUNTY SPENDING MAP (Mapbox choropleth)
# ═══════════════════════════════════════════════════════════════════

class CountySpending(BaseModel):
    """
    Aggregate spending data per county for the M2 Taswira map.
    Drives the Mapbox choropleth colouring of Kenya's 47 counties.
    Includes incident counts for the M3 Ripoti heat map overlay.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{
                "county": "Nairobi",
                "county_code": "047",
                "total_spending": 450000000.00,
                "candidate_count": 42,
                "avg_spending_per_candidate": 10714285.71,
                "total_contributions": 520000000.00,
                "incident_count": 12,
                "compliance_summary": {
                    "compliant": 35,
                    "warning": 5,
                    "violation": 2,
                },
            }]
        }
    )

    county: str = Field(
        description="County name (1 of 47).",
        examples=["Nairobi"],
    )
    county_code: str = Field(
        description="County code (three-digit string, e.g., '047' for Nairobi).",
        examples=["047"],
    )
    total_spending: Decimal = Field(
        description="Total campaign expenditure across all candidates in this county (KES).",
        examples=[450000000.00],
    )
    candidate_count: int = Field(
        description="Number of candidates contesting in this county.",
        examples=[42],
    )
    avg_spending_per_candidate: Decimal = Field(
        description="Average spending per candidate (KES).",
        examples=[10714285.71],
    )
    total_contributions: Decimal = Field(
        description="Total contributions received across all candidates (KES).",
        examples=[520000000.00],
    )
    incident_count: int = Field(
        default=0,
        description="Number of reported incidents in this county (M3 Ripoti).",
        examples=[12],
    )
    compliance_summary: Optional[dict] = Field(
        default=None,
        description="Count of candidates by compliance status "
                    "(COMPLIANT / WARNING / VIOLATION).",
    )


class CountySpendingList(BaseModel):
    """Complete dataset for the county spending map (all 47 counties)."""
    counties: List[CountySpending] = Field(
        description="Spending data for each of Kenya's 47 counties.",
    )
    national_total_spending: Decimal = Field(
        description="Sum of all candidate spending nationally (KES).",
    )
    national_total_contributions: Decimal = Field(
        description="Sum of all contributions nationally (KES).",
    )
    total_candidates: int = Field(
        description="Total number of candidates across all counties.",
    )


# ═══════════════════════════════════════════════════════════════════
# SPENDING TIMELINE (Recharts line chart)
# ═══════════════════════════════════════════════════════════════════

class TimelineDataPoint(BaseModel):
    """
    Single data point in a cumulative spending timeline.
    Used for Recharts LineChart in M1 Fedha Dashboard.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{
                "date": "2027-06-15",
                "cumulative_spending": 28500000.00,
                "daily_spending": 1250000.00,
                "spending_limit": 50000000.00,
                "utilisation_pct": 57.0,
            }]
        }
    )

    date: _dt.date = Field(
        description="Date of the data point.",
        examples=["2027-06-15"],
    )
    cumulative_spending: Decimal = Field(
        description="Running total of expenditure up to this date (KES).",
        examples=[28500000.00],
    )
    daily_spending: Decimal = Field(
        default=Decimal("0.00"),
        description="Spending on this specific date (KES).",
        examples=[1250000.00],
    )
    spending_limit: Optional[Decimal] = Field(
        default=None,
        description="IEBC-gazetted spending limit (KES). "
                    "Plotted as a horizontal reference line.",
        examples=[50000000.00],
    )
    utilisation_pct: Optional[float] = Field(
        default=None,
        description="Cumulative spending as percentage of limit.",
        examples=[57.0],
    )


class SpendingTimeline(BaseModel):
    """Complete timeline dataset for a candidate or county."""
    candidate_id: Optional[str] = Field(
        default=None,
        description="Candidate UUID (if candidate-specific timeline).",
    )
    candidate_name: Optional[str] = None
    county: Optional[str] = None
    data_points: List[TimelineDataPoint] = Field(
        default_factory=list,
        description="Ordered list of daily data points.",
    )
    spending_limit: Optional[Decimal] = Field(
        default=None,
        description="IEBC-gazetted limit for the reference line.",
    )


# ═══════════════════════════════════════════════════════════════════
# PARTY COMPARISON (Recharts bar chart)
# ═══════════════════════════════════════════════════════════════════

class PartyComparison(BaseModel):
    """
    Aggregate financial data per political party for comparison charts.
    Drives the Recharts BarChart in M1 Fedha Dashboard.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{
                "party_name": "Orange Democratic Movement",
                "party_abbreviation": "ODM",
                "total_spending": 2800000000.00,
                "total_contributions": 3200000000.00,
                "candidate_count": 247,
                "avg_spending_per_candidate": 11336032.39,
                "counties_represented": 45,
                "compliance_rate_pct": 92.3,
            }]
        }
    )

    party_name: str = Field(examples=["Orange Democratic Movement"])
    party_abbreviation: str = Field(examples=["ODM"])
    total_spending: Decimal = Field(
        description="Total expenditure across all party candidates (KES).",
        examples=[2800000000.00],
    )
    total_contributions: Decimal = Field(
        description="Total contributions across all party candidates (KES).",
        examples=[3200000000.00],
    )
    candidate_count: int = Field(
        description="Number of candidates fielded by this party.",
        examples=[247],
    )
    avg_spending_per_candidate: Decimal = Field(
        description="Average spending per candidate (KES).",
        examples=[11336032.39],
    )
    counties_represented: int = Field(
        default=0,
        description="Number of counties where the party has candidates.",
        examples=[45],
    )
    compliance_rate_pct: float = Field(
        default=0.0,
        description="Percentage of party candidates within spending limits.",
        examples=[92.3],
    )
    incident_count: int = Field(
        default=0,
        description="Number of reported incidents involving this party.",
    )


class PartyComparisonList(BaseModel):
    """Dataset for the party comparison bar chart."""
    parties: List[PartyComparison] = Field(
        description="Financial comparison data for each party.",
    )
    total_parties: int = Field(
        description="Number of parties included in the comparison.",
    )


# ═══════════════════════════════════════════════════════════════════
# CATEGORY BREAKDOWN (Recharts pie/donut chart)
# ═══════════════════════════════════════════════════════════════════

class NationalCategoryBreakdown(BaseModel):
    """
    National-level expenditure breakdown by ECF Act s.19 categories.
    Drives the donut chart on the M1 Fedha national overview.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{
                "category": "ADVERTISING",
                "category_label": "Advertising for the campaigns",
                "total_amount": 12500000000.00,
                "percentage_of_total": 31.2,
                "transaction_count": 14520,
            }]
        }
    )

    category: str = Field(
        description="ECF Act s.19 category code.",
        examples=["ADVERTISING"],
    )
    category_label: str = Field(
        description="Human-readable label from ECF Act s.19 wording.",
        examples=["Advertising for the campaigns"],
    )
    total_amount: Decimal = Field(examples=[12500000000.00])
    percentage_of_total: float = Field(examples=[31.2])
    transaction_count: int = Field(examples=[14520])
