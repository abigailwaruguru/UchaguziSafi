"""
UCHAGUZI SAFI — Contributions API Router
==========================================
Global contribution endpoints (create + list).
Per-candidate contribution lists live on GET /candidates/{id}/contributions.

ECF Act references:
  - s.11:  Lawful sources
  - s.12:  Single-source ≤ 20% cap
  - s.13:  Anonymous contributions — report to IEBC within 14 days
  - s.14:  Public resource contributions PROHIBITED
  - s.16:  Receipts required for > KES 20,000; harambee record-keeping

Endpoints:
  POST  /    Record a new contribution
  GET   /    List all contributions (paginated, filterable)
"""

from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.candidate import Candidate
from app.models.contribution import Contribution, ContributionSourceType
from app.schemas.common import PaginatedResponse
from app.schemas.contribution import ContributionCreate, ContributionListItem, ContributionResponse

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════
# 1. POST / — Record a new contribution
# ═══════════════════════════════════════════════════════════════════

@router.post(
    "/",
    response_model=ContributionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a new campaign contribution",
    description=(
        "Record a contribution to a candidate's campaign fund. "
        "Validates ECF Act rules: "
        "s.16(1) contributor name required for amounts > KES 20,000; "
        "s.16(2) harambee fields required for HARAMBEE source type; "
        "s.14 public resource contributions are flagged as prohibited."
    ),
)
async def create_contribution(
    data: ContributionCreate,
    db: AsyncSession = Depends(get_db),
):
    # Verify candidate exists
    candidate = (await db.execute(
        select(Candidate).where(Candidate.id == data.candidate_id)
    )).scalar_one_or_none()
    if candidate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate '{data.candidate_id}' not found.",
        )

    contribution = Contribution(
        candidate_id=data.candidate_id,
        amount=data.amount,
        source_type=data.source_type,
        date_received=data.date_received,
        contributor_name=data.contributor_name,
        contributor_id_number=data.contributor_id_number,
        contributor_email=data.contributor_email,
        contributor_phone=data.contributor_phone,
        contributor_postal_address=data.contributor_postal_address,
        contributor_physical_address=data.contributor_physical_address,
        receipt_number=data.receipt_number,
        description=data.description,
        is_anonymous=data.is_anonymous,
        is_from_public_resource=data.is_from_public_resource,
        harambee_venue=data.harambee_venue,
        harambee_date=data.harambee_date,
        harambee_organiser=data.harambee_organiser,
        harambee_total_collected=data.harambee_total_collected,
        is_non_monetary=data.is_non_monetary,
        non_monetary_description=data.non_monetary_description,
    )
    db.add(contribution)

    # Update candidate totals
    candidate.total_contributions = (candidate.total_contributions or Decimal("0")) + data.amount
    await db.commit()
    await db.refresh(contribution)

    return ContributionResponse.model_validate(contribution)


# ═══════════════════════════════════════════════════════════════════
# 2. GET / — List all contributions
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/",
    response_model=PaginatedResponse[ContributionListItem],
    summary="List all contributions",
    description=(
        "Paginated list of all contributions across all candidates. "
        "Filterable by candidate, source type, anonymous flag, and amount range."
    ),
)
async def list_contributions(
    db: AsyncSession = Depends(get_db),
    candidate_id: Optional[UUID] = Query(None, description="Filter by candidate UUID."),
    source_type: Optional[ContributionSourceType] = Query(None, description="Filter by source type."),
    is_anonymous: Optional[bool] = Query(None, description="Filter anonymous contributions."),
    is_from_public_resource: Optional[bool] = Query(None, description="Filter public resource contributions."),
    min_amount: Optional[float] = Query(None, ge=0, description="Minimum amount (KES)."),
    max_amount: Optional[float] = Query(None, ge=0, description="Maximum amount (KES)."),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
):
    conditions = []
    if candidate_id:
        conditions.append(Contribution.candidate_id == candidate_id)
    if source_type:
        conditions.append(Contribution.source_type == source_type)
    if is_anonymous is not None:
        conditions.append(Contribution.is_anonymous == is_anonymous)
    if is_from_public_resource is not None:
        conditions.append(Contribution.is_from_public_resource == is_from_public_resource)
    if min_amount is not None:
        conditions.append(Contribution.amount >= Decimal(str(min_amount)))
    if max_amount is not None:
        conditions.append(Contribution.amount <= Decimal(str(max_amount)))

    where_clause = and_(*conditions) if conditions else True

    total = (await db.execute(
        select(func.count(Contribution.id)).where(where_clause)
    )).scalar() or 0

    offset = (page - 1) * per_page
    rows = (await db.execute(
        select(Contribution)
        .where(where_clause)
        .order_by(Contribution.date_received.desc(), Contribution.amount.desc())
        .offset(offset)
        .limit(per_page)
    )).scalars().all()

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
        for c in rows
    ]

    return PaginatedResponse.create(items=items, total=total, page=page, per_page=per_page)
