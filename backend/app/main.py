"""
UCHAGUZI SAFI — Main Application Entry Point
=============================================
FastAPI application serving Kenya's campaign finance transparency platform.

Module-to-Router Mapping (Swahili names per project architecture):
  M1  Fedha Dashboard   → /api/v1/candidates, /api/v1/contributions, /api/v1/expenditures
  M2  Taswira            → /api/v1/visualisation
  M3  Ripoti Ubadhirifu  → /api/v1/incidents
  M4  Tafuta             → /api/v1/candidates (search & registry)
  M5  Tahadhari          → /api/v1/alerts
  M6  Usimamizi          → /api/v1/auth, /api/v1/admin

Legal Basis: Election Campaign Financing Act, Cap. 7A (2013)
Regulatory Body: Independent Electoral and Boundaries Commission (IEBC)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

settings = get_settings()


# ── Lifespan: startup / shutdown logic ───────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: Log launch, verify DB connectivity (future).
    Shutdown: Dispose engine connections gracefully.
    """
    # Startup
    print(f"🇰🇪  {settings.app_name} v{settings.app_version} starting…")
    print(f"   Environment : {settings.environment}")
    print(f"   Debug       : {settings.DEBUG}")
    print(f"   ECF Act constants loaded:")
    print(f"     • Disclosure threshold : KES {settings.contribution_disclosure_threshold:,}")
    print(f"     • Single-source cap    : {settings.single_source_contribution_cap_percent}%")
    print(f"     • Max statutory fine    : KES {settings.max_fine_kes:,}")
    yield
    # Shutdown
    from app.core.database import engine
    await engine.dispose()
    print(f"🇰🇪  {settings.app_name} shut down cleanly.")


# ── FastAPI Application ──────────────────────────────────────────────
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "REST API for campaign finance transparency in Kenya. "
        "Implements monitoring tools aligned with the Election Campaign "
        "Financing Act (Cap. 7A, 2013) and IEBC regulatory framework. "
        "Built for citizen oversight ahead of the 2027 General Elections."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ── CORS Middleware ──────────────────────────────────────────────────
# Permits the React frontend (localhost:3000 / 5173 in dev) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ─────────────────────────────────────────────────────
@app.get(
    "/health",
    tags=["System"],
    summary="Service health check",
    response_model=dict,
)
async def health_check():
    """
    Lightweight probe for load balancers and monitoring.
    Returns application metadata and ECF Act regulatory constants
    currently in effect.
    """
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "legal_framework": {
            "act": "Election Campaign Financing Act, Cap. 7A",
            "year": 2013,
            "regulator": "Independent Electoral and Boundaries Commission (IEBC)",
            "disclosure_threshold_kes": settings.contribution_disclosure_threshold,
            "single_source_cap_pct": settings.single_source_contribution_cap_percent,
        },
    }


# ── Root Endpoint ────────────────────────────────────────────────────
@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Karibu! Welcome to Uchaguzi Safi API",
        "docs": "/docs",
        "health": "/health",
    }


# ── Router Registration ─────────────────────────────────────────────
# Each router is imported and mounted under /api/v1/.
# Uncomment as modules are implemented during the hackathon sprint.

# --- M6 Usimamizi: Auth & Admin (implement first — gates other modules) ---
from app.api.routes import auth
app.include_router(auth.router, prefix="/api/v1/auth", tags=["M6 Usimamizi — Auth"])

# --- M1 Fedha Dashboard: Core campaign finance data ---
from app.api.routes import candidates
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["M4 Tafuta — Candidates"])

from app.api.routes import contributions
app.include_router(contributions.router, prefix="/api/v1/contributions", tags=["M1 Fedha — Contributions"])

from app.api.routes import expenditures
app.include_router(expenditures.router, prefix="/api/v1/expenditures", tags=["M1 Fedha — Expenditures"])

# --- M3 Ripoti Ubadhirifu: Public resource misuse tracking ---
from app.api.routes import incidents
app.include_router(incidents.router, prefix="/api/v1/incidents", tags=["M3 Ripoti — Incidents"])

# --- M2 Taswira: Data Visualisation aggregates ---
from app.api.routes import visualisation
app.include_router(visualisation.router, prefix="/api/v1/visualisation", tags=["M2 Taswira — Visualisation"])

# --- M5 Tahadhari: Alert System ---
from app.api.routes import alerts
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["M5 Tahadhari — Alerts"])
