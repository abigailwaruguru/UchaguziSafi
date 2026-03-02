"""
UCHAGUZI SAFI — Pydantic Schemas Package
===========================================
Central export of all request/response schemas.
Used by API route handlers for validation and serialisation.

Schema-to-Module Mapping:
  ┌─────────────────────────┬──────────────────────────────────────┐
  │ Schema Module            │ Uchaguzi Safi Module(s)              │
  ├─────────────────────────┼──────────────────────────────────────┤
  │ common.py               │ All — pagination, standard responses │
  │ party.py                │ M4 Tafuta (Search & Registry)        │
  │ candidate.py            │ M4 Tafuta, M1 Fedha Dashboard        │
  │ contribution.py         │ M1 Fedha, M5 Tahadhari               │
  │ expenditure.py          │ M1 Fedha, M2 Taswira                 │
  │ incident.py             │ M3 Ripoti Ubadhirifu                 │
  │ visualisation.py        │ M2 Taswira, M1 Fedha                 │
  └─────────────────────────┴──────────────────────────────────────┘
"""

# ── Common ───────────────────────────────────────────────────────
from app.schemas.common import (
    HealthResponse,
    MessageResponse,
    PaginatedResponse,
    PaginationParams,
    TimestampMixin,
    UUIDMixin,
)

# ── Party ────────────────────────────────────────────────────────
from app.schemas.party import (
    PartyBase,
    PartyCreate,
    PartyList,
    PartyListItem,
    PartyResponse,
    PartyUpdate,
)

# ── Candidate ────────────────────────────────────────────────────
from app.schemas.candidate import (
    CandidateBase,
    CandidateComparison,
    CandidateComparisonItem,
    CandidateCreate,
    CandidateFinanceSummary,
    CandidateListItem,
    CandidateResponse,
    CandidateUpdate,
    CategoryBreakdown,
    TopContributor,
)

# ── Contribution ─────────────────────────────────────────────────
from app.schemas.contribution import (
    ContributionBase,
    ContributionBreakdown,
    ContributionCreate,
    ContributionListItem,
    ContributionResponse,
    SourceTypeBreakdown,
)

# ── Expenditure ──────────────────────────────────────────────────
from app.schemas.expenditure import (
    CategoryBreakdownItem,
    ExpenditureBase,
    ExpenditureBreakdown,
    ExpenditureCreate,
    ExpenditureListItem,
    ExpenditureResponse,
)

# ── Incident ─────────────────────────────────────────────────────
from app.schemas.incident import (
    EvidenceItem,
    IncidentBase,
    IncidentCreate,
    IncidentListItem,
    IncidentResponse,
    IncidentStatusUpdate,
    IncidentTrackingResponse,
    StatusHistoryItem,
)

# ── Visualisation ────────────────────────────────────────────────
from app.schemas.visualisation import (
    CountySpending,
    CountySpendingList,
    NationalCategoryBreakdown,
    PartyComparison,
    PartyComparisonList,
    SpendingTimeline,
    TimelineDataPoint,
)

__all__ = [
    # Common
    "PaginationParams", "PaginatedResponse", "MessageResponse",
    "HealthResponse", "TimestampMixin", "UUIDMixin",
    # Party
    "PartyBase", "PartyCreate", "PartyUpdate",
    "PartyResponse", "PartyListItem", "PartyList",
    # Candidate
    "CandidateBase", "CandidateCreate", "CandidateUpdate",
    "CandidateResponse", "CandidateListItem",
    "CandidateFinanceSummary", "TopContributor", "CategoryBreakdown",
    "CandidateComparison", "CandidateComparisonItem",
    # Contribution
    "ContributionBase", "ContributionCreate",
    "ContributionResponse", "ContributionListItem",
    "ContributionBreakdown", "SourceTypeBreakdown",
    # Expenditure
    "ExpenditureBase", "ExpenditureCreate",
    "ExpenditureResponse", "ExpenditureListItem",
    "ExpenditureBreakdown", "CategoryBreakdownItem",
    # Incident
    "IncidentBase", "IncidentCreate",
    "IncidentResponse", "IncidentListItem",
    "IncidentStatusUpdate", "IncidentTrackingResponse",
    "EvidenceItem", "StatusHistoryItem",
    # Visualisation
    "CountySpending", "CountySpendingList",
    "TimelineDataPoint", "SpendingTimeline",
    "PartyComparison", "PartyComparisonList",
    "NationalCategoryBreakdown",
]
