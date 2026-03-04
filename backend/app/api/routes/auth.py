"""
UCHAGUZI SAFI — Auth API Router (M6 Usimamizi)
================================================
Authentication and admin endpoints.
Not yet implemented — returns 501 until the auth module is built.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get(
    "/",
    summary="Auth module status",
    tags=["M6 Usimamizi — Auth"],
)
async def auth_status():
    return {"status": "not_implemented", "module": "M6 Usimamizi — Auth"}
