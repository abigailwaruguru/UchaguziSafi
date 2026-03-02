"""
UCHAGUZI SAFI — Candidates API Router
========================================
CRUD operations and financial analytics for candidates contesting
elective posts in Kenya's elections.

ECF Act references:
  - s.2:   Candidate definition
  - s.6:   Authorised persons — IEBC registration
  - s.12:  Contribution limits (single source ≤ 20% of total)
  - s.18:  IEBC-gazetted spending limits per election type
  - s.19:  Authorised expenditure categories (6 categories EXACTLY)
  - s.23:  Offences — exceeding limits without justification
  - s.26:  Record-keeping obligations

Module mapping:
  - M4 Tafuta:  GET /candidates, GET /candidates/{id}, GET /candidates/compare
  - M1 Fedha:   GET /candidates/{id}/finance,
                 GET /candidates/{id}/contributions,
                 GET /candidates/{id}/expenditures

Endpoints:
  GET    /                      List candidates (filtered, paginated)
  GET    /compare               Side-by-side comparison of candidates
  GET    /{candidate_id}        Full candidate profile
  GET    /{candidate_id}/finance            Financial summary + compliance
  GET    /{candidate_id}/contributions      Paginated contributions
  GET    /{candidate_id}/expenditures       Paginated expenditures
"""

from decimal import Decimal
from math import ceil
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.models.candidate import Candidate, CandidateStatus, ElectionType
from app.models.contribution import Contribution, ContributionSourceType
from app.models.expenditure import Expenditure, ExpenditureCategory
from app.models.party import PoliticalParty
from app.schemas.candidate import (
    CandidateComparison,
    CandidateComparisonItem,
    CandidateFinanceSummary,
    CandidateListItem,
    CandidateResponse,
    CategoryBreakdown,
    TopContributor,
)
from app.schemas.common import PaginatedResponse
from app.schemas.contribution import ContributionListItem
from app.schemas.expenditure import ExpenditureListItem

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════
# HELPER: Resolve candidate or 404
# ═══════════════════════════════════════════════════════════════════

async def _get_candidate_or_404(
    candidate_id: UUID,
    db: AsyncSession,
    load_party: bool = True,
) -> Candidate:
    """
    Fetch a candidate by UUID, optionally eager-loading the party
    relationship. Raises 404 if not found.
    """
    stmt = select(Candidate).where(Candidate.id == candidate_id)
    if load_party:
        stmt = stmt.options(selectinload(Candidate.party))
    result = await db.execute(stmt)
    candidate = result.scalar_one_or_none()
    if candidate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with id '{candidate_id}' not found.",
        )
    return candidate


def _build_candidate_response(candidate: Candidate) -> dict:
    """
    Map a Candidate ORM object to a response dict,
    denormalising party fields for display convenience.
    """
    return {
        "id": candidate.id,
        "full_name": candidate.full_name,
        "photo_url": candidate.photo_url,
        "bio": candidate.bio,
        "party_id": candidate.party_id,
        "is_independent": candidate.is_independent,
        "election_type": candidate.election_type,
        "county": candidate.county,
        "constituency": candidate.constituency,
        "ward": candidate.ward,
        "status": candidate.status,
        "spending_limit": candidate.spending_limit,
        "total_contributions": candidate.total_contributions,
        "total_expenditure": candidate.total_expenditure,
        "iebc_registration_date": candidate.iebc_registration_date,
        "expenditure_account_number": candidate.expenditure_account_number,
        "party_name": candidate.party.name if candidate.party else None,
        "party_abbreviation": (
            candidate.party.abbreviation if candidate.party else None
        ),
        "created_at": candidate.created_at,
        "updated_at": candidate.updated_at,
    }


def _compliance_status(utilisation_pct: float) -> str:
    """
    Derive ECF Act s.18 compliance status from spending utilisation.
    Maps to frontend Tailwind tokens:
      status-compliant (#006600), status-warning (#F57F17), status-violation (#BB0000)
    """
    if utilisation_pct >= 100:
        return "VIOLATION"
    elif utilisation_pct >= 80:
        return "WARNING"
    return "COMPLIANT"


# ═══════════════════════════════════════════════════════════════════
# 1. GET / — List candidates (M4 Tafuta)
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/",
    response_model=PaginatedResponse[CandidateListItem],
    summary="List candidates with filtering and pagination",
    description=(
        "Search and filter candidates across Kenya's 47 counties. "
        "Supports filtering by county, party, election type, and name search. "
        "Returns compact candidate cards for the M4 Tafuta search results."
    ),
)
async def list_candidates(
    db: AsyncSession = Depends(get_db),
    county: Optional[str] = Query(
        None, description="Filter by county name (e.g., 'Nairobi')."
    ),
    party_id: Optional[UUID] = Query(
        None, description="Filter by political party UUID."
    ),
    election_type: Optional[ElectionType] = Query(
        None, description="Filter by election type (PRESIDENTIAL, GOVERNOR, etc.)."
    ),
    status_filter: Optional[CandidateStatus] = Query(
        None, alias="status", description="Filter by candidate status."
    ),
    search: Optional[str] = Query(
        None,
        min_length=2,
        description="Search by candidate name (partial match).",
    ),
    page: int = Query(1, ge=1, description="Page number."),
    per_page: int = Query(10, ge=1, le=100, description="Items per page."),
):
    # ── Build filtered query ─────────────────────────────────────
    conditions = []
    if county:
        conditions.append(Candidate.county.ilike(f"%{county}%"))
    if party_id:
        conditions.append(Candidate.party_id == party_id)
    if election_type:
        conditions.append(Candidate.election_type == election_type)
    if status_filter:
        conditions.append(Candidate.status == status_filter)
    if search:
        conditions.append(Candidate.full_name.ilike(f"%{search}%"))

    where_clause = and_(*conditions) if conditions else True

    # ── Count total matching records ─────────────────────────────
    count_stmt = select(func.count(Candidate.id)).where(where_clause)
    total = (await db.execute(count_stmt)).scalar() or 0

    # ── Fetch page with party join ───────────────────────────────
    offset = (page - 1) * per_page
    data_stmt = (
        select(Candidate)
        .where(where_clause)
        .options(selectinload(Candidate.party))
        .order_by(Candidate.full_name)
        .offset(offset)
        .limit(per_page)
    )
    result = await db.execute(data_stmt)
    candidates = result.scalars().all()

    # ── Map to list items ────────────────────────────────────────
    items = [
        CandidateListItem(
            id=c.id,
            full_name=c.full_name,
            election_type=c.election_type,
            county=c.county,
            constituency=c.constituency,
            status=c.status,
            party_name=c.party.name if c.party else None,
            party_abbreviation=c.party.abbreviation if c.party else None,
            photo_url=c.photo_url,
            total_expenditure=c.total_expenditure,
            spending_limit=c.spending_limit,
        )
        for c in candidates
    ]

    return PaginatedResponse.create(
        items=items, total=total, page=page, per_page=per_page
    )


# ═══════════════════════════════════════════════════════════════════
# 2. GET /compare — Side-by-side comparison (M1 Fedha)
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/compare",
    response_model=CandidateComparison,
    summary="Compare candidates side-by-side",
    description=(
        "Compare financial profiles of 2–10 candidates. "
        "Used for the M1 Fedha Dashboard comparison view and "
        "M2 Taswira visualisations."
    ),
)
async def compare_candidates(
    db: AsyncSession = Depends(get_db),
    ids: str = Query(
        ...,
        description="Comma-separated candidate UUIDs (2–10).",
        examples=["uuid1,uuid2"],
    ),
):
    # ── Parse and validate IDs ───────────────────────────────────
    try:
        candidate_ids = [UUID(id_str.strip()) for id_str in ids.split(",")]
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format in 'ids' parameter.",
        )

    if len(candidate_ids) < 2 or len(candidate_ids) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide between 2 and 10 candidate IDs for comparison.",
        )

    # ── Fetch candidates ─────────────────────────────────────────
    stmt = (
        select(Candidate)
        .where(Candidate.id.in_(candidate_ids))
        .options(selectinload(Candidate.party))
    )
    result = await db.execute(stmt)
    candidates = result.scalars().all()

    if len(candidates) < 2:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Found only {len(candidates)} of {len(candidate_ids)} "
                   f"requested candidates.",
        )

    # ── Build comparison items with top-spend category ───────────
    comparison_items = []
    for c in candidates:
        # Find the highest-spend category
        cat_stmt = (
            select(
                Expenditure.category,
                func.sum(Expenditure.amount).label("cat_total"),
            )
            .where(Expenditure.candidate_id == c.id)
            .group_by(Expenditure.category)
            .order_by(func.sum(Expenditure.amount).desc())
            .limit(1)
        )
        cat_result = await db.execute(cat_stmt)
        top_cat_row = cat_result.first()

        # Count transactions
        contrib_count = (await db.execute(
            select(func.count(Contribution.id))
            .where(Contribution.candidate_id == c.id)
        )).scalar() or 0

        exp_count = (await db.execute(
            select(func.count(Expenditure.id))
            .where(Expenditure.candidate_id == c.id)
        )).scalar() or 0

        util_pct = (
            float(c.total_expenditure / c.spending_limit * 100)
            if c.spending_limit > 0 else 0.0
        )

        comparison_items.append(CandidateComparisonItem(
            candidate_id=c.id,
            candidate_name=c.full_name,
            party_name=c.party.name if c.party else None,
            party_abbreviation=c.party.abbreviation if c.party else None,
            total_contributions=c.total_contributions,
            total_expenditure=c.total_expenditure,
            spending_limit=c.spending_limit,
            spending_utilisation_pct=round(util_pct, 1),
            compliance_status=_compliance_status(util_pct),
            contribution_count=contrib_count,
            expenditure_count=exp_count,
            top_category=top_cat_row.category.value if top_cat_row else None,
            top_category_amount=top_cat_row.cat_total if top_cat_row else None,
        ))

    # Use first candidate's election context
    first = candidates[0]
    return CandidateComparison(
        election_type=first.election_type,
        county=first.county,
        candidates=comparison_items,
    )


# ═══════════════════════════════════════════════════════════════════
# 3. GET /{candidate_id} — Full profile (M4 Tafuta)
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/{candidate_id}",
    response_model=CandidateResponse,
    summary="Get candidate profile",
    description=(
        "Retrieve full candidate profile including party affiliation, "
        "financial totals, and compliance status. "
        "Displayed on the M4 Tafuta candidate detail page."
    ),
)
async def get_candidate(
    candidate_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    candidate = await _get_candidate_or_404(candidate_id, db)
    return CandidateResponse(**_build_candidate_response(candidate))


# ═══════════════════════════════════════════════════════════════════
# 4. GET /{candidate_id}/finance — Financial summary (M1 Fedha)
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/{candidate_id}/finance",
    response_model=CandidateFinanceSummary,
    summary="Get candidate financial summary",
    description=(
        "Comprehensive financial analytics for a candidate. Includes: "
        "contribution breakdown by source type (ECF Act s.11), "
        "expenditure breakdown by s.19 categories, "
        "top 5 contributors with single-source cap check (s.12(2)), "
        "and compliance status against IEBC spending limits (s.18). "
        "Populates the M1 Fedha Dashboard candidate detail view."
    ),
)
async def get_candidate_finance(
    candidate_id: UUID,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    candidate = await _get_candidate_or_404(candidate_id, db)

    # ── Contribution analytics ───────────────────────────────────

    # Count and totals
    contrib_count_stmt = (
        select(func.count(Contribution.id))
        .where(Contribution.candidate_id == candidate_id)
    )
    contribution_count = (await db.execute(contrib_count_stmt)).scalar() or 0

    # Anonymous contributions (s.13 violations)
    anon_stmt = (
        select(
            func.count(Contribution.id),
            func.coalesce(func.sum(Contribution.amount), 0),
        )
        .where(
            and_(
                Contribution.candidate_id == candidate_id,
                Contribution.is_anonymous == True,
            )
        )
    )
    anon_result = (await db.execute(anon_stmt)).first()
    anon_count = anon_result[0] or 0
    anon_total = anon_result[1] or Decimal("0.00")

    # Breakdown by source type (ECF Act s.11)
    source_stmt = (
        select(
            Contribution.source_type,
            func.sum(Contribution.amount).label("total"),
            func.count(Contribution.id).label("cnt"),
        )
        .where(Contribution.candidate_id == candidate_id)
        .group_by(Contribution.source_type)
        .order_by(func.sum(Contribution.amount).desc())
    )
    source_rows = (await db.execute(source_stmt)).all()

    contribution_breakdown = []
    for row in source_rows:
        pct = (
            float(row.total / candidate.total_contributions * 100)
            if candidate.total_contributions > 0 else 0.0
        )
        contribution_breakdown.append(CategoryBreakdown(
            category=row.source_type.value,
            total_amount=row.total,
            percentage_of_total=round(pct, 1),
            transaction_count=row.cnt,
        ))

    # Top 5 contributors by total amount (s.12(2) single-source check)
    top_contrib_stmt = (
        select(
            Contribution.contributor_name,
            Contribution.source_type,
            func.sum(Contribution.amount).label("total"),
            func.count(Contribution.id).label("cnt"),
        )
        .where(
            and_(
                Contribution.candidate_id == candidate_id,
                Contribution.contributor_name.isnot(None),
            )
        )
        .group_by(Contribution.contributor_name, Contribution.source_type)
        .order_by(func.sum(Contribution.amount).desc())
        .limit(5)
    )
    top_rows = (await db.execute(top_contrib_stmt)).all()

    single_source_cap_pct = settings.single_source_contribution_cap_percent
    top_contributors = []
    for row in top_rows:
        pct = (
            float(row.total / candidate.total_contributions * 100)
            if candidate.total_contributions > 0 else 0.0
        )
        top_contributors.append(TopContributor(
            contributor_name=row.contributor_name,
            total_amount=row.total,
            source_type=row.source_type.value,
            contribution_count=row.cnt,
            percentage_of_total=round(pct, 1),
            exceeds_single_source_cap=pct > single_source_cap_pct,
        ))

    # ── Expenditure analytics ────────────────────────────────────

    exp_count_stmt = (
        select(func.count(Expenditure.id))
        .where(Expenditure.candidate_id == candidate_id)
    )
    expenditure_count = (await db.execute(exp_count_stmt)).scalar() or 0

    # Breakdown by s.19 category
    cat_labels = {
        ExpenditureCategory.VENUE: "Venue where campaign activities may be undertaken",
        ExpenditureCategory.PUBLICITY: "Publicity material for campaigns",
        ExpenditureCategory.ADVERTISING: "Advertising for the campaigns",
        ExpenditureCategory.PERSONNEL: "Campaign personnel",
        ExpenditureCategory.TRANSPORT: "Transportation in respect of campaign activities",
        ExpenditureCategory.OTHER: "Other justifiable expenses",
    }

    cat_stmt = (
        select(
            Expenditure.category,
            func.sum(Expenditure.amount).label("total"),
            func.count(Expenditure.id).label("cnt"),
        )
        .where(Expenditure.candidate_id == candidate_id)
        .group_by(Expenditure.category)
        .order_by(func.sum(Expenditure.amount).desc())
    )
    cat_rows = (await db.execute(cat_stmt)).all()

    expenditure_by_category = []
    for row in cat_rows:
        pct = (
            float(row.total / candidate.total_expenditure * 100)
            if candidate.total_expenditure > 0 else 0.0
        )
        expenditure_by_category.append(CategoryBreakdown(
            category=row.category.value,
            total_amount=row.total,
            percentage_of_total=round(pct, 1),
            transaction_count=row.cnt,
        ))

    # ── Compliance calculation (ECF Act s.18) ────────────────────
    util_pct = (
        float(candidate.total_expenditure / candidate.spending_limit * 100)
        if candidate.spending_limit > 0 else 0.0
    )
    remaining = candidate.spending_limit - candidate.total_expenditure

    return CandidateFinanceSummary(
        candidate_id=candidate.id,
        candidate_name=candidate.full_name,
        election_type=candidate.election_type,
        county=candidate.county,
        party_name=candidate.party.name if candidate.party else None,
        spending_limit=candidate.spending_limit,
        total_contributions=candidate.total_contributions,
        total_expenditure=candidate.total_expenditure,
        remaining_budget=max(remaining, Decimal("0.00")),
        spending_utilisation_pct=round(util_pct, 1),
        compliance_status=_compliance_status(util_pct),
        contribution_count=contribution_count,
        top_contributors=top_contributors,
        anonymous_contribution_count=anon_count,
        anonymous_contribution_total=anon_total,
        expenditure_count=expenditure_count,
        expenditure_by_category=expenditure_by_category,
    )


# ═══════════════════════════════════════════════════════════════════
# 5. GET /{candidate_id}/contributions — Contribution list (M1 Fedha)
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/{candidate_id}/contributions",
    response_model=PaginatedResponse[ContributionListItem],
    summary="List candidate contributions",
    description=(
        "Paginated list of all contributions received by a candidate. "
        "Filterable by source type (ECF Act s.11) and amount range. "
        "Supports the M1 Fedha Dashboard contributions tab."
    ),
)
async def list_candidate_contributions(
    candidate_id: UUID,
    db: AsyncSession = Depends(get_db),
    source_type: Optional[ContributionSourceType] = Query(
        None, description="Filter by contribution source type (s.11)."
    ),
    min_amount: Optional[float] = Query(
        None, ge=0, description="Minimum contribution amount (KES)."
    ),
    max_amount: Optional[float] = Query(
        None, ge=0, description="Maximum contribution amount (KES)."
    ),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
):
    # Verify candidate exists
    await _get_candidate_or_404(candidate_id, db, load_party=False)

    # ── Build filtered query ─────────────────────────────────────
    conditions = [Contribution.candidate_id == candidate_id]
    if source_type:
        conditions.append(Contribution.source_type == source_type)
    if min_amount is not None:
        conditions.append(Contribution.amount >= Decimal(str(min_amount)))
    if max_amount is not None:
        conditions.append(Contribution.amount <= Decimal(str(max_amount)))

    where_clause = and_(*conditions)

    # Count
    total = (await db.execute(
        select(func.count(Contribution.id)).where(where_clause)
    )).scalar() or 0

    # Fetch page
    offset = (page - 1) * per_page
    data_stmt = (
        select(Contribution)
        .where(where_clause)
        .order_by(Contribution.date_received.desc(), Contribution.amount.desc())
        .offset(offset)
        .limit(per_page)
    )
    contributions = (await db.execute(data_stmt)).scalars().all()

    items = [
        ContributionListItem(
            id=c.id,
            amount=c.amount,
            source_type=c.source_type,
            contributor_name=c.contributor_name,
            date_received=c.date_received,
            is_anonymous=c.is_anonymous,
            is_from_public_resource=c.is_from_public_resource,
            receipt_number=c.receipt_number,
        )
        for c in contributions
    ]

    return PaginatedResponse.create(
        items=items, total=total, page=page, per_page=per_page
    )


# ═══════════════════════════════════════════════════════════════════
# 6. GET /{candidate_id}/expenditures — Expenditure list (M1 Fedha)
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/{candidate_id}/expenditures",
    response_model=PaginatedResponse[ExpenditureListItem],
    summary="List candidate expenditures",
    description=(
        "Paginated list of all expenditures incurred by a candidate. "
        "Filterable by ECF Act s.19 category and amount range. "
        "Supports the M1 Fedha Dashboard expenditures tab."
    ),
)
async def list_candidate_expenditures(
    candidate_id: UUID,
    db: AsyncSession = Depends(get_db),
    category: Optional[ExpenditureCategory] = Query(
        None, description="Filter by s.19 category: VENUE, PUBLICITY, "
                          "ADVERTISING, PERSONNEL, TRANSPORT, OTHER."
    ),
    min_amount: Optional[float] = Query(
        None, ge=0, description="Minimum expenditure amount (KES)."
    ),
    max_amount: Optional[float] = Query(
        None, ge=0, description="Maximum expenditure amount (KES)."
    ),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
):
    # Verify candidate exists
    await _get_candidate_or_404(candidate_id, db, load_party=False)

    # ── Build filtered query ─────────────────────────────────────
    conditions = [Expenditure.candidate_id == candidate_id]
    if category:
        conditions.append(Expenditure.category == category)
    if min_amount is not None:
        conditions.append(Expenditure.amount >= Decimal(str(min_amount)))
    if max_amount is not None:
        conditions.append(Expenditure.amount <= Decimal(str(max_amount)))

    where_clause = and_(*conditions)

    # Count
    total = (await db.execute(
        select(func.count(Expenditure.id)).where(where_clause)
    )).scalar() or 0

    # Fetch page
    offset = (page - 1) * per_page
    data_stmt = (
        select(Expenditure)
        .where(where_clause)
        .order_by(Expenditure.date_incurred.desc(), Expenditure.amount.desc())
        .offset(offset)
        .limit(per_page)
    )
    expenditures = (await db.execute(data_stmt)).scalars().all()

    items = [
        ExpenditureListItem(
            id=e.id,
            amount=e.amount,
            category=e.category,
            description=e.description,
            date_incurred=e.date_incurred,
            vendor_name=e.vendor_name,
            is_verified=e.is_verified,
        )
        for e in expenditures
    ]

    return PaginatedResponse.create(
        items=items, total=total, page=page, per_page=per_page
    )
