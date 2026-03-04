"""
UCHAGUZI SAFI — Visualisation API Router
==========================================
Aggregation endpoints for M2 Taswira (Data Visualisation).
Drives Recharts and React Map GL components on the frontend.

Endpoints:
  GET  /county-spending       Aggregate spending per county (choropleth map)
  GET  /party-comparison      Aggregate spending per political party (bar chart)
  GET  /category-breakdown    National expenditure by ECF Act s.19 category (donut)
  GET  /candidate/{id}/timeline   Cumulative spending timeline for one candidate
"""

from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.candidate import Candidate
from app.models.expenditure import Expenditure, ExpenditureCategory
from app.models.incident import Incident, IncidentStatus
from app.models.party import PoliticalParty
from app.schemas.visualisation import (
    CountySpending,
    CountySpendingList,
    NationalCategoryBreakdown,
    PartyComparison,
    PartyComparisonList,
    SpendingTimeline,
    TimelineDataPoint,
)

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════
# 1. GET /county-spending — Choropleth map data (M2 Taswira)
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/county-spending",
    response_model=CountySpendingList,
    summary="County-level spending aggregates for the map",
    description=(
        "Returns total spending, contributions, and incident counts "
        "for each of Kenya's 47 counties. Drives the Mapbox choropleth "
        "colouring in M2 Taswira."
    ),
)
async def get_county_spending(
    db: AsyncSession = Depends(get_db),
):
    # Aggregate spending and candidate count per county
    county_stmt = (
        select(
            Candidate.county,
            func.count(Candidate.id).label("candidate_count"),
            func.coalesce(func.sum(Candidate.total_expenditure), 0).label("total_spending"),
            func.coalesce(func.sum(Candidate.total_contributions), 0).label("total_contributions"),
        )
        .where(Candidate.county.isnot(None))
        .group_by(Candidate.county)
        .order_by(func.sum(Candidate.total_expenditure).desc().nulls_last())
    )
    county_rows = (await db.execute(county_stmt)).all()

    # Incident counts per county
    incident_stmt = (
        select(
            Incident.county,
            func.count(Incident.id).label("incident_count"),
        )
        .group_by(Incident.county)
    )
    incident_map = {
        row.county: row.incident_count
        for row in (await db.execute(incident_stmt)).all()
    }

    # Compliance summary per county
    compliance_stmt = (
        select(
            Candidate.county,
            func.count(Candidate.id).filter(
                Candidate.total_expenditure < Candidate.spending_limit * Decimal("0.80")
            ).label("compliant"),
            func.count(Candidate.id).filter(
                and_(
                    Candidate.total_expenditure >= Candidate.spending_limit * Decimal("0.80"),
                    Candidate.total_expenditure < Candidate.spending_limit,
                )
            ).label("warning"),
            func.count(Candidate.id).filter(
                Candidate.total_expenditure >= Candidate.spending_limit
            ).label("violation"),
        )
        .where(and_(Candidate.county.isnot(None), Candidate.spending_limit > 0))
        .group_by(Candidate.county)
    )
    compliance_map = {
        row.county: {"compliant": row.compliant, "warning": row.warning, "violation": row.violation}
        for row in (await db.execute(compliance_stmt)).all()
    }

    national_spending = Decimal("0")
    national_contributions = Decimal("0")
    total_candidates = 0
    counties = []

    for row in county_rows:
        avg = (
            Decimal(str(row.total_spending)) / row.candidate_count
            if row.candidate_count > 0 else Decimal("0")
        )
        national_spending += Decimal(str(row.total_spending))
        national_contributions += Decimal(str(row.total_contributions))
        total_candidates += row.candidate_count

        counties.append(CountySpending(
            county=row.county,
            county_code="000",  # County codes can be added when gazzetted list is available
            total_spending=Decimal(str(row.total_spending)),
            candidate_count=row.candidate_count,
            avg_spending_per_candidate=avg,
            total_contributions=Decimal(str(row.total_contributions)),
            incident_count=incident_map.get(row.county, 0),
            compliance_summary=compliance_map.get(row.county),
        ))

    return CountySpendingList(
        counties=counties,
        national_total_spending=national_spending,
        national_total_contributions=national_contributions,
        total_candidates=total_candidates,
    )


# ═══════════════════════════════════════════════════════════════════
# 2. GET /party-comparison — Party comparison bar chart
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/party-comparison",
    response_model=PartyComparisonList,
    summary="Party-level spending comparison",
    description=(
        "Aggregates total spending, contributions, and candidate counts "
        "per political party. Drives the Recharts BarChart in M1 Fedha Dashboard."
    ),
)
async def get_party_comparison(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(
            PoliticalParty.name.label("party_name"),
            PoliticalParty.abbreviation.label("party_abbreviation"),
            func.count(Candidate.id).label("candidate_count"),
            func.coalesce(func.sum(Candidate.total_expenditure), 0).label("total_spending"),
            func.coalesce(func.sum(Candidate.total_contributions), 0).label("total_contributions"),
            func.count(func.distinct(Candidate.county)).label("counties_represented"),
        )
        .join(Candidate, Candidate.party_id == PoliticalParty.id, isouter=True)
        .group_by(PoliticalParty.id, PoliticalParty.name, PoliticalParty.abbreviation)
        .order_by(func.sum(Candidate.total_expenditure).desc().nulls_last())
    )
    rows = (await db.execute(stmt)).all()

    parties = []
    for row in rows:
        total_spending = Decimal(str(row.total_spending))
        avg = total_spending / row.candidate_count if row.candidate_count > 0 else Decimal("0")

        # Compliance rate: candidates within spending limit
        compliant_stmt = (
            select(func.count(Candidate.id))
            .join(PoliticalParty, Candidate.party_id == PoliticalParty.id)
            .where(
                and_(
                    PoliticalParty.name == row.party_name,
                    Candidate.spending_limit > 0,
                    Candidate.total_expenditure < Candidate.spending_limit,
                )
            )
        )
        compliant_count = (await db.execute(compliant_stmt)).scalar() or 0
        compliance_rate = (
            round(compliant_count / row.candidate_count * 100, 1)
            if row.candidate_count > 0 else 0.0
        )

        parties.append(PartyComparison(
            party_name=row.party_name,
            party_abbreviation=row.party_abbreviation or "",
            total_spending=total_spending,
            total_contributions=Decimal(str(row.total_contributions)),
            candidate_count=row.candidate_count,
            avg_spending_per_candidate=avg,
            counties_represented=row.counties_represented or 0,
            compliance_rate_pct=compliance_rate,
        ))

    return PartyComparisonList(parties=parties, total_parties=len(parties))


# ═══════════════════════════════════════════════════════════════════
# 3. GET /category-breakdown — National s.19 category donut
# ═══════════════════════════════════════════════════════════════════

CATEGORY_LABELS = {
    ExpenditureCategory.VENUE: "Venue where campaign activities may be undertaken",
    ExpenditureCategory.PUBLICITY: "Publicity material for campaigns",
    ExpenditureCategory.ADVERTISING: "Advertising for the campaigns",
    ExpenditureCategory.PERSONNEL: "Campaign personnel",
    ExpenditureCategory.TRANSPORT: "Transportation in respect of campaign activities",
    ExpenditureCategory.OTHER: "Other justifiable expenses",
}

@router.get(
    "/category-breakdown",
    response_model=List[NationalCategoryBreakdown],
    summary="National expenditure breakdown by ECF Act s.19 category",
    description=(
        "Aggregates all expenditures nationally by the 6 ECF Act s.19 categories. "
        "Drives the donut chart on the M1 Fedha national overview."
    ),
)
async def get_category_breakdown(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(
            Expenditure.category,
            func.sum(Expenditure.amount).label("total_amount"),
            func.count(Expenditure.id).label("transaction_count"),
        )
        .group_by(Expenditure.category)
        .order_by(func.sum(Expenditure.amount).desc())
    )
    rows = (await db.execute(stmt)).all()

    national_total = sum(Decimal(str(r.total_amount)) for r in rows) or Decimal("1")

    return [
        NationalCategoryBreakdown(
            category=row.category.value,
            category_label=CATEGORY_LABELS.get(row.category, row.category.value),
            total_amount=Decimal(str(row.total_amount)),
            percentage_of_total=round(
                float(Decimal(str(row.total_amount)) / national_total * 100), 1
            ),
            transaction_count=row.transaction_count,
        )
        for row in rows
    ]


# ═══════════════════════════════════════════════════════════════════
# 4. GET /candidates/{candidate_id}/timeline — Spending timeline
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/candidates/{candidate_id}/timeline",
    response_model=SpendingTimeline,
    summary="Cumulative spending timeline for a candidate",
    description=(
        "Returns daily and cumulative spending data for a candidate. "
        "Drives the Recharts LineChart in M1 Fedha Dashboard. "
        "Includes the spending limit as a reference line."
    ),
)
async def get_candidate_timeline(
    candidate_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    candidate = (await db.execute(
        select(Candidate).where(Candidate.id == candidate_id)
    )).scalar_one_or_none()
    if candidate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate '{candidate_id}' not found.",
        )

    # Daily spending grouped by date
    stmt = (
        select(
            Expenditure.date_incurred,
            func.sum(Expenditure.amount).label("daily_total"),
        )
        .where(Expenditure.candidate_id == candidate_id)
        .group_by(Expenditure.date_incurred)
        .order_by(Expenditure.date_incurred)
    )
    rows = (await db.execute(stmt)).all()

    cumulative = Decimal("0")
    data_points = []
    for row in rows:
        daily = Decimal(str(row.daily_total))
        cumulative += daily
        util_pct = (
            round(float(cumulative / candidate.spending_limit * 100), 1)
            if candidate.spending_limit and candidate.spending_limit > 0 else None
        )
        data_points.append(TimelineDataPoint(
            date=row.date_incurred,
            cumulative_spending=cumulative,
            daily_spending=daily,
            spending_limit=candidate.spending_limit if candidate.spending_limit > 0 else None,
            utilisation_pct=util_pct,
        ))

    return SpendingTimeline(
        candidate_id=str(candidate_id),
        candidate_name=candidate.full_name,
        county=candidate.county,
        data_points=data_points,
        spending_limit=candidate.spending_limit if candidate.spending_limit > 0 else None,
    )
