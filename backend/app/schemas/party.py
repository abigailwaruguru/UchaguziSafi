"""
UCHAGUZI SAFI — Political Party Schemas
==========================================
Pydantic v2 schemas for political party CRUD operations.
Parties are registered under the Political Parties Act (Cap. 7D)
as referenced in ECF Act s.2.

Module mapping: M4 Tafuta (Search & Registry)
"""

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ═══════════════════════════════════════════════════════════════════
# BASE / CREATE / UPDATE
# ═══════════════════════════════════════════════════════════════════

class PartyBase(BaseModel):
    """Shared fields for party creation and response."""

    name: str = Field(
        min_length=2,
        max_length=300,
        description="Official registered name of the political party.",
        examples=["Orange Democratic Movement"],
    )
    abbreviation: str = Field(
        min_length=1,
        max_length=20,
        description="Party abbreviation/acronym.",
        examples=["ODM"],
    )
    registration_number: Optional[str] = Field(
        default=None,
        max_length=50,
        description="Registration number assigned by the Registrar of Political Parties.",
        examples=["PP/001/2012"],
    )
    logo_url: Optional[str] = Field(
        default=None,
        max_length=500,
        description="URL to party logo image.",
        examples=["https://storage.uchaguzi.ke/logos/odm.png"],
    )
    founded_date: Optional[date] = Field(
        default=None,
        description="Date the party was officially founded.",
        examples=["2005-09-01"],
    )
    headquarters: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Physical address of party headquarters.",
        examples=["Orange House, Nairobi"],
    )
    contact_email: Optional[str] = Field(
        default=None,
        max_length=254,
        description="Official contact email for IEBC correspondence.",
        examples=["info@odm.co.ke"],
    )
    contact_phone: Optional[str] = Field(
        default=None,
        max_length=20,
        description="Official phone number.",
        examples=["+254700000001"],
    )
    description: Optional[str] = Field(
        default=None,
        description="Brief description of the party platform.",
        examples=["A social democratic political party in Kenya."],
    )


class PartyCreate(PartyBase):
    """Schema for creating a new political party record."""
    pass


class PartyUpdate(BaseModel):
    """Schema for partial updates to a party record."""
    name: Optional[str] = Field(default=None, min_length=2, max_length=300)
    abbreviation: Optional[str] = Field(default=None, min_length=1, max_length=20)
    registration_number: Optional[str] = Field(default=None, max_length=50)
    logo_url: Optional[str] = Field(default=None, max_length=500)
    headquarters: Optional[str] = Field(default=None, max_length=500)
    contact_email: Optional[str] = Field(default=None, max_length=254)
    contact_phone: Optional[str] = Field(default=None, max_length=20)
    description: Optional[str] = Field(default=None)
    is_active: Optional[bool] = Field(default=None)


# ═══════════════════════════════════════════════════════════════════
# RESPONSE
# ═══════════════════════════════════════════════════════════════════

class PartyResponse(PartyBase):
    """
    Full party response including system fields.
    Returned by GET /api/v1/candidates and party detail endpoints.
    """

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [{
                "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "name": "Orange Democratic Movement",
                "abbreviation": "ODM",
                "registration_number": "PP/001/2012",
                "is_active": True,
                "founded_date": "2005-09-01",
                "headquarters": "Orange House, Nairobi",
                "candidate_count": 247,
                "created_at": "2026-01-15T10:00:00Z",
                "updated_at": "2026-02-20T14:30:00Z",
            }]
        }
    )

    id: UUID = Field(description="Party UUID.")
    is_active: bool = Field(description="Whether the party is currently registered and active.")
    candidate_count: int = Field(
        default=0,
        description="Number of candidates sponsored by this party in the current election.",
    )
    created_at: datetime = Field(description="Record creation timestamp.")
    updated_at: datetime = Field(description="Last modification timestamp.")


class PartyListItem(BaseModel):
    """Compact party representation for list views and dropdowns."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    abbreviation: str
    logo_url: Optional[str] = None
    is_active: bool
    candidate_count: int = 0


class PartyList(BaseModel):
    """Paginated list of parties for M4 Tafuta search results."""

    model_config = ConfigDict(from_attributes=True)

    items: List[PartyListItem]
    total: int = Field(description="Total matching parties.", examples=[16])
