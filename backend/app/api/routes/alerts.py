"""
UCHAGUZI SAFI — Alerts API Router (M5 Tahadhari)
==================================================
Alert system for ECF Act compliance breaches.
Not yet implemented — returns stub response until the alerts module is built.

Planned alerts:
  - Single-source cap breach (s.12(2) > 20%)
  - Spending limit warning (s.18 ≥ 80%)
  - Spending limit violation (s.18 ≥ 100%)
  - Anonymous contribution flag (s.13)
  - Public resource contribution (s.14)
"""

from fastapi import APIRouter

router = APIRouter()


@router.get(
    "/",
    summary="Alerts module status",
    tags=["M5 Tahadhari — Alerts"],
)
async def alerts_status():
    return {"status": "not_implemented", "module": "M5 Tahadhari — Alerts"}
