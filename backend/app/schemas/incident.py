"""
UCHAGUZI SAFI — Incident Schemas
===================================
Pydantic v2 schemas for the M3 Ripoti Ubadhirifu (Public Resource
Misuse Tracker) module.

ECF Act references:
  - s.2:   "public resource" definition (monies, vehicles, premises)
  - s.14:  Prohibition on public resource use for campaigns
  - s.21:  Complaint lodging, investigation, determination
  - s.21(3): 7 days (pre-election) / 14 days (post-election) timeline

Human-centred design:
  - Anonymous submission supported (reporter fields optional)
  - UCH-2027-XXXX tracking numbers for status checks without login
  - GPS coordinates from mobile device
"""

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.incident import IncidentStatus, IncidentType


# ═══════════════════════════════════════════════════════════════════
# BASE / CREATE
# ═══════════════════════════════════════════════════════════════════

class IncidentBase(BaseModel):
    """Shared fields for incident creation and response."""

    incident_type: IncidentType = Field(
        description="Type of public resource misuse per ECF Act s.2. "
                    "STATE_FUNDS | VEHICLE_EQUIPMENT | PREMISES | PERSONNEL | OTHER.",
        examples=[IncidentType.VEHICLE_EQUIPMENT],
    )
    title: str = Field(
        min_length=5,
        max_length=500,
        description="Brief title summarising the incident.",
        examples=["County government vehicle used for campaign rally transport"],
    )
    description: str = Field(
        min_length=20,
        description="Detailed description of the incident. "
                    "Supports the complaint under ECF Act s.21(1).",
        examples=[
            "On 15 June 2027 at approximately 14:00, a white Toyota Land Cruiser "
            "bearing Government of Kenya plates (GK 234 A) was observed transporting "
            "campaign materials and supporters to a political rally at Uhuru Park."
        ],
    )
    date_occurred: date = Field(
        description="Date the incident occurred or was observed.",
        examples=["2027-06-15"],
    )
    county: str = Field(
        min_length=2,
        max_length=100,
        description="Kenya county where the incident occurred.",
        examples=["Nairobi"],
    )


class IncidentCreate(IncidentBase):
    """
    Schema for submitting a new incident report.
    Designed for the M3 Ripoti mobile form.
    """

    constituency: Optional[str] = Field(
        default=None,
        max_length=200,
        description="Constituency where the incident occurred.",
        examples=["Starehe"],
    )

    # GPS from mobile device
    location_description: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Human-readable location.",
        examples=["Near Uhuru Park main entrance, Nairobi CBD"],
    )
    location_lat: Optional[float] = Field(
        default=None,
        description="Latitude from mobile GPS.",
        examples=[-1.2864],
    )
    location_lng: Optional[float] = Field(
        default=None,
        description="Longitude from mobile GPS.",
        examples=[36.8172],
    )

    # Linked entities (optional — reporter may not know)
    candidate_id: Optional[UUID] = Field(
        default=None,
        description="Candidate allegedly involved (if known).",
    )
    party_id: Optional[UUID] = Field(
        default=None,
        description="Political party allegedly involved (if known).",
    )

    # Reporter information (all optional for anonymous submission)
    is_anonymous: bool = Field(
        default=False,
        description="True to submit anonymously. Reporter fields ignored.",
    )
    reporter_name: Optional[str] = Field(
        default=None,
        max_length=300,
        description="Reporter name (NULL if anonymous).",
        examples=["John Kamau"],
    )
    reporter_email: Optional[str] = Field(
        default=None,
        max_length=254,
        description="Reporter email for status updates (stored encrypted).",
        examples=["jkamau@email.co.ke"],
    )
    reporter_phone: Optional[str] = Field(
        default=None,
        max_length=20,
        description="Reporter phone for SMS updates (stored encrypted).",
        examples=["+254722000000"],
    )

    @field_validator("location_lat")
    @classmethod
    def validate_latitude(cls, v):
        """Validate latitude is within Kenya's geographic range."""
        if v is not None and not (-4.7 <= v <= 5.5):
            raise ValueError(
                "Latitude must be within Kenya's range (-4.7 to 5.5)."
            )
        return v

    @field_validator("location_lng")
    @classmethod
    def validate_longitude(cls, v):
        """Validate longitude is within Kenya's geographic range."""
        if v is not None and not (33.9 <= v <= 41.9):
            raise ValueError(
                "Longitude must be within Kenya's range (33.9 to 41.9)."
            )
        return v

    @model_validator(mode="after")
    def validate_anonymous_consistency(self):
        """If anonymous, clear reporter fields for safety."""
        if self.is_anonymous:
            self.reporter_name = None
            self.reporter_email = None
            self.reporter_phone = None
        return self


# ═══════════════════════════════════════════════════════════════════
# RESPONSE
# ═══════════════════════════════════════════════════════════════════

class EvidenceItem(BaseModel):
    """Evidence file summary within an incident response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    file_url: str
    file_type: str
    original_filename: str
    file_size_bytes: int
    description: Optional[str] = None
    exif_timestamp: Optional[datetime] = None
    uploaded_at: datetime


class StatusHistoryItem(BaseModel):
    """Single status change in the incident audit trail."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    old_status: Optional[IncidentStatus] = None
    new_status: IncidentStatus
    notes: Optional[str] = None
    changed_by: Optional[str] = None
    changed_at: datetime


class IncidentResponse(IncidentBase):
    """
    Full incident response with tracking number, evidence, and status history.
    Displayed on the M3 Ripoti tracking page.
    """

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "examples": [{
                "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
                "tracking_number": "UCH-2027-0042",
                "incident_type": "VEHICLE_EQUIPMENT",
                "title": "County government vehicle used for rally transport",
                "status": "UNDER_REVIEW",
                "county": "Nairobi",
                "is_anonymous": False,
                "evidence_count": 2,
            }]
        }
    )

    id: UUID
    tracking_number: str = Field(
        description="Public tracking number (UCH-2027-XXXX). "
                    "Used by reporters to check status without login.",
    )
    status: IncidentStatus
    date_reported: datetime

    # Location
    location_description: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    constituency: Optional[str] = None

    # Linked entities
    candidate_id: Optional[UUID] = None
    candidate_name: Optional[str] = Field(
        default=None,
        description="Candidate name (denormalised for display).",
    )
    party_id: Optional[UUID] = None
    party_name: Optional[str] = Field(
        default=None,
        description="Party name (denormalised for display).",
    )

    # Reporter (masked for privacy)
    is_anonymous: bool = False

    # Nested data
    evidence_files: List[EvidenceItem] = Field(
        default_factory=list,
        description="Supporting evidence files.",
    )
    status_history: List[StatusHistoryItem] = Field(
        default_factory=list,
        description="Audit trail of status changes (s.21(3) compliance).",
    )

    evidence_count: int = Field(
        default=0,
        description="Number of evidence files attached.",
    )

    created_at: datetime
    updated_at: datetime


class IncidentListItem(BaseModel):
    """Compact incident for list views and M2 Taswira map markers."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tracking_number: str
    incident_type: IncidentType
    title: str
    county: str
    status: IncidentStatus
    date_occurred: date
    date_reported: datetime
    is_anonymous: bool = False
    evidence_count: int = 0
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None


# ═══════════════════════════════════════════════════════════════════
# STATUS UPDATE
# ═══════════════════════════════════════════════════════════════════

class IncidentStatusUpdate(BaseModel):
    """
    Schema for updating an incident's status.
    Used by reviewers/IEBC officers (M6 Usimamizi module).
    Follows the s.21 complaint determination process.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{
                "new_status": "VERIFIED",
                "notes": "Evidence confirms use of GK vehicle. Escalating to IEBC.",
                "changed_by": "admin@uchaguzi.ke",
            }]
        }
    )

    new_status: IncidentStatus = Field(
        description="New status for the incident. "
                    "Must follow valid transitions.",
        examples=[IncidentStatus.VERIFIED],
    )
    notes: Optional[str] = Field(
        default=None,
        description="Reviewer notes explaining the status change. "
                    "Visible on the tracking page.",
        examples=["Evidence confirmed. Two photographs show GK plates clearly."],
    )
    changed_by: str = Field(
        description="Identifier of the person making the change.",
        examples=["admin@uchaguzi.ke"],
    )

    @field_validator("new_status")
    @classmethod
    def validate_status_transition(cls, v):
        """
        Ensure status follows valid transitions per s.21 process.
        SUBMITTED → UNDER_REVIEW → VERIFIED → ESCALATED → RESOLVED
                                 ↘ REJECTED
        """
        valid_statuses = {
            IncidentStatus.SUBMITTED,
            IncidentStatus.UNDER_REVIEW,
            IncidentStatus.VERIFIED,
            IncidentStatus.ESCALATED,
            IncidentStatus.RESOLVED,
            IncidentStatus.REJECTED,
        }
        if v not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {[s.value for s in valid_statuses]}")
        return v


# ═══════════════════════════════════════════════════════════════════
# TRACKING (public endpoint — no auth required)
# ═══════════════════════════════════════════════════════════════════

class IncidentTrackingResponse(BaseModel):
    """
    Minimal response for the public tracking endpoint.
    Accessible without login using tracking_number (UCH-2027-XXXX).
    Does NOT expose reporter details or internal notes.
    """

    tracking_number: str = Field(examples=["UCH-2027-0042"])
    incident_type: IncidentType
    title: str
    county: str
    status: IncidentStatus
    date_occurred: date
    date_reported: datetime
    evidence_count: int = 0
    last_updated: datetime = Field(
        description="Timestamp of the most recent status change.",
    )
    status_updates: List[StatusHistoryItem] = Field(
        default_factory=list,
        description="Public-facing status timeline (notes may be redacted).",
    )
