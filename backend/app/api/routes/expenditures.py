"""
UCHAGUZI SAFI — Expenditures API Router
=========================================
Global expenditure endpoints (create + list).
Per-candidate expenditure lists live on GET /candidates/{id}/expenditures.

ECF Act references:
  - s.18:  IEBC-gazetted spending limits per election type
  - s.19:  Authorised categories: VENUE, PUBLICITY, ADVERTISING,
           PERSONNEL, TRANSPORT, OTHER
  - s.26:  Record-keeping obligations

Endpoints:
  POST  /    Record a new expenditure
  GET   /    List all expenditures (paginated, filterable)
"""

from decimal import Decimal
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.candidate import Candidate
from app.models.expenditure import Expenditure, ExpenditureCategory
from app.schemas.common import PaginatedResponse
from app.schemas.expenditure import ExpenditureCreate, ExpenditureListItem, ExpenditureResponse

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════
# 1. POST / — Record a new expenditure
# ═══════════════════════════════════════════════════════════════════

@router.post(
    "/",
    response_model=ExpenditureResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a new campaign expenditure",
    description=(
        "Record an expenditure against a candidate's campaign fund. "
        "Category must be one of the 6 ECF Act s.19 authorised types. "
        "Candidate's total_expenditure is updated and checked against "
        "the IEBC-gazetted spending limit (s.18)."
    ),
)
async def create_expenditure(
    data: ExpenditureCreate,
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

    expenditure = Expenditure(
        candidate_id=data.candidate_id,
        amount=data.amount,
        category=data.category,
        description=data.description,
        date_incurred=data.date_incurred,
        vendor_name=data.vendor_name,
        vendor_contact=data.vendor_contact,
        receipt_url=data.receipt_url,
        payment_method=data.payment_method,
        reference_number=data.reference_number,
    )
    db.add(expenditure)

    # Update candidate totals
    candidate.total_expenditure = (candidate.total_expenditure or Decimal("0")) + data.amount
    await db.commit()
    await db.refresh(expenditure)

    return ExpenditureResponse.model_validate(expenditure)


# ═══════════════════════════════════════════════════════════════════
# 2. GET / — List all expenditures
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/",
    response_model=PaginatedResponse[ExpenditureListItem],
    summary="List all expenditures",
    description=(
        "Paginated list of all expenditures across all candidates. "
        "Filterable by candidate, ECF Act s.19 category, verification status, "
        "and amount range."
    ),
)
async def list_expenditures(
    db: AsyncSession = Depends(get_db),
    candidate_id: Optional[UUID] = Query(None, description="Filter by candidate UUID."),
    category: Optional[ExpenditureCategory] = Query(None, description="Filter by s.19 category."),
    is_verified: Optional[bool] = Query(None, description="Filter by verification status."),
    min_amount: Optional[float] = Query(None, ge=0, description="Minimum amount (KES)."),
    max_amount: Optional[float] = Query(None, ge=0, description="Maximum amount (KES)."),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
):
    conditions = []
    if candidate_id:
        conditions.append(Expenditure.candidate_id == candidate_id)
    if category:
        conditions.append(Expenditure.category == category)
    if is_verified is not None:
        conditions.append(Expenditure.is_verified == is_verified)
    if min_amount is not None:
        conditions.append(Expenditure.amount >= Decimal(str(min_amount)))
    if max_amount is not None:
        conditions.append(Expenditure.amount <= Decimal(str(max_amount)))

    where_clause = and_(*conditions) if conditions else True

    total = (await db.execute(
        select(func.count(Expenditure.id)).where(where_clause)
    )).scalar() or 0

    offset = (page - 1) * per_page
    rows = (await db.execute(
        select(Expenditure)
        .where(where_clause)
        .order_by(Expenditure.date_incurred.desc(), Expenditure.amount.desc())
        .offset(offset)
        .limit(per_page)
    )).scalars().all()

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
        for e in rows
    ]

    return PaginatedResponse.create(items=items, total=total, page=page, per_page=per_page)
