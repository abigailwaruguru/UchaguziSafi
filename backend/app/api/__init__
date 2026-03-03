"""
UCHAGUZI SAFI — API Router Aggregator
========================================
Creates the main APIRouter and includes all sub-routers
under the /api/v1 prefix.

Router-to-Module Mapping:
  ┌─────────────────────┬──────────────────────┬─────────────────────┐
  │ Prefix              │ Router               │ Module              │
  ├─────────────────────┼──────────────────────┼─────────────────────┤
  │ /candidates         │ candidates.router    │ M4 Tafuta           │
  │ /contributions      │ contributions.router │ M1 Fedha            │
  │ /expenditures       │ expenditures.router  │ M1 Fedha            │
  │ /incidents          │ incidents.router     │ M3 Ripoti Ubadhirifu│
  │ /visualisation      │ visualisation.router │ M2 Taswira          │
  │ /alerts             │ alerts.router        │ M5 Tahadhari        │
  │ /auth               │ auth.router          │ M6 Usimamizi        │
  └─────────────────────┴──────────────────────┴─────────────────────┘

Usage in main.py:
  from app.api import api_router
  app.include_router(api_router, prefix="/api/v1")
"""

from fastapi import APIRouter

# ── Main API Router ──────────────────────────────────────────────
api_router = APIRouter()

# ── M4 Tafuta: Candidate Search & Registry ───────────────────────
from app.api.routes.candidates import router as candidates_router

api_router.include_router(
    candidates_router,
    prefix="/candidates",
    tags=["M4 Tafuta — Candidates"],
)

# ── M1 Fedha: Contributions (implement next) ────────────────────
# from app.api.routes.contributions import router as contributions_router
# api_router.include_router(
#     contributions_router,
#     prefix="/contributions",
#     tags=["M1 Fedha — Contributions"],
# )

# ── M1 Fedha: Expenditures (implement next) ─────────────────────
# from app.api.routes.expenditures import router as expenditures_router
# api_router.include_router(
#     expenditures_router,
#     prefix="/expenditures",
#     tags=["M1 Fedha — Expenditures"],
# )

# ── M3 Ripoti Ubadhirifu: Incidents ─────────────────────────────
# from app.api.routes.incidents import router as incidents_router
# api_router.include_router(
#     incidents_router,
#     prefix="/incidents",
#     tags=["M3 Ripoti — Incidents"],
# )

# ── M2 Taswira: Visualisation ───────────────────────────────────
# from app.api.routes.visualisation import router as visualisation_router
# api_router.include_router(
#     visualisation_router,
#     prefix="/visualisation",
#     tags=["M2 Taswira — Visualisation"],
# )

# ── M5 Tahadhari: Alerts ────────────────────────────────────────
# from app.api.routes.alerts import router as alerts_router
# api_router.include_router(
#     alerts_router,
#     prefix="/alerts",
#     tags=["M5 Tahadhari — Alerts"],
# )

# ── M6 Usimamizi: Auth & Admin ──────────────────────────────────
# from app.api.routes.auth import router as auth_router
# api_router.include_router(
#     auth_router,
#     prefix="/auth",
#     tags=["M6 Usimamizi — Auth"],
# )
