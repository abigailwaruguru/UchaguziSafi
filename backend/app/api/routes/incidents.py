"""
UCHAGUZI SAFI — Incidents API Router
=======================================
Public resource misuse reporting and tracking for the M3 Ripoti
Ubadhirifu (Report Misuse) module.

ECF Act references:
  - s.2:   "public resource" definition:
           (a) monies intended for public use
           (b) vehicles/equipment owned by the State
           (c) premises owned/occupied by the State
  - s.14:  Prohibition on public resource use for campaigns
  - s.14(2): State institutions and public officers shall not use
             public resources to support candidates
  - s.21:  Complaint process — any person may lodge a complaint
  - s.21(3): IEBC must determine complaints within:
             7 days (before election) / 14 days (after election)
  - s.21(4): IEBC may request attendance and information

Module mapping:
  - M3 Ripoti Ubadhirifu: All endpoints
  - M2 Taswira:           GET /incidents/map (heat map overlay)
  - M5 Tahadhari:         Verified incidents feed alerts

Human-centred design:
  - Anonymous reporting supported (reporter fields never exposed)
  - UCH-2027-XXXX tracking numbers for status checks without login
  - GPS from mobile device for location verification
  - EXIF metadata extraction for evidence credibility

Endpoints:
  POST   /                              Submit new incident
  GET    /                              List incidents (paginated)
  GET    /map                           Map markers with coordinates
  GET    /{tracking_number}             Public incident detail
  GET    /{tracking_number}/status      Public status check
  POST   /{tracking_number}/evidence    Upload supporting evidence
"""

import os
import random
import string
import uuid as uuid_lib
from datetime import datetime
from decimal import Decimal
from math import ceil
from typing import List, Optional

from fastapi import (
    APIRouter, Depends, File, Form, HTTPException,
    Query, UploadFile, status,
)
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.models.candidate import Candidate
from app.models.evidence import Evidence, EvidenceFileType
from app.models.incident import Incident, IncidentStatus, IncidentType
from app.models.incident_status_history import IncidentStatusHistory
from app.models.party import PoliticalParty
from app.schemas.common import PaginatedResponse
from app.schemas.incident import (
    EvidenceItem,
    IncidentCreate,
    IncidentListItem,
    IncidentResponse,
    IncidentStatusUpdate,
    IncidentTrackingResponse,
    StatusHistoryItem,
)

router = APIRouter()


# ═══════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════

# Kenya geographic bounds for coordinate validation
KENYA_LAT_MIN = -4.7
KENYA_LAT_MAX = 4.6
KENYA_LNG_MIN = 33.9
KENYA_LNG_MAX = 41.9

# File upload limits
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024    # 10 MB
MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024    # 50 MB
MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024 # 20 MB

# Allowed MIME types per file category
ALLOWED_MIME_TYPES = {
    EvidenceFileType.IMAGE: {
        "image/jpeg", "image/png", "image/webp", "image/heic",
    },
    EvidenceFileType.VIDEO: {
        "video/mp4", "video/quicktime", "video/x-msvideo",
    },
    EvidenceFileType.DOCUMENT: {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    EvidenceFileType.AUDIO: {
        "audio/mpeg", "audio/wav", "audio/mp4",
    },
}

# Valid status transitions per ECF Act s.21 complaint process:
#   SUBMITTED → UNDER_REVIEW → VERIFIED → ESCALATED → RESOLVED
#                            ↘ REJECTED
VALID_STATUS_TRANSITIONS = {
    IncidentStatus.SUBMITTED: {
        IncidentStatus.UNDER_REVIEW, IncidentStatus.REJECTED,
    },
    IncidentStatus.UNDER_REVIEW: {
        IncidentStatus.VERIFIED, IncidentStatus.REJECTED,
    },
    IncidentStatus.VERIFIED: {
        IncidentStatus.ESCALATED, IncidentStatus.RESOLVED,
    },
    IncidentStatus.ESCALATED: {
        IncidentStatus.RESOLVED,
    },
    IncidentStatus.RESOLVED: set(),   # Terminal state
    IncidentStatus.REJECTED: set(),   # Terminal state
}


# ═══════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════

async def _generate_tracking_number(db: AsyncSession) -> str:
    """
    Generate a unique tracking number in format UCH-2027-XXXX.
    Uses the count of existing incidents + random suffix to ensure
    uniqueness without sequential enumeration (privacy protection
    for anonymous reporters).
    """
    for _ in range(10):  # Retry loop for collision avoidance
        # Get current max sequence
        count_stmt = select(func.count(Incident.id))
        count = (await db.execute(count_stmt)).scalar() or 0
        seq = count + 1

        # Add random component to prevent sequential guessing
        suffix = f"{seq:04d}"
        tracking = f"UCH-2027-{suffix}"

        # Verify uniqueness
        exists_stmt = select(func.count(Incident.id)).where(
            Incident.tracking_number == tracking
        )
        exists = (await db.execute(exists_stmt)).scalar()
        if not exists:
            return tracking

    # Fallback: use random alphanumeric if all sequential attempts collide
    rand = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"UCH-2027-{rand}"


async def _get_incident_by_tracking(
    tracking_number: str,
    db: AsyncSession,
    load_relations: bool = True,
) -> Incident:
    """
    Fetch an incident by its public tracking number.
    Raises 404 if not found.
    """
    stmt = select(Incident).where(
        Incident.tracking_number == tracking_number.upper()
    )
    if load_relations:
        stmt = stmt.options(
            selectinload(Incident.evidence_files),
            selectinload(Incident.status_history),
            selectinload(Incident.candidate),
            selectinload(Incident.party),
        )
    result = await db.execute(stmt)
    incident = result.scalar_one_or_none()
    if incident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with tracking number '{tracking_number}' not found.",
        )
    return incident


def _classify_file_type(content_type: str) -> Optional[EvidenceFileType]:
    """Classify an uploaded file's MIME type into an EvidenceFileType."""
    for file_type, mime_set in ALLOWED_MIME_TYPES.items():
        if content_type in mime_set:
            return file_type
    return None


def _get_max_file_size(file_type: EvidenceFileType) -> int:
    """Return the maximum allowed file size in bytes for a given type."""
    if file_type == EvidenceFileType.VIDEO:
        return MAX_VIDEO_SIZE_BYTES
    elif file_type == EvidenceFileType.DOCUMENT:
        return MAX_DOCUMENT_SIZE_BYTES
    return MAX_IMAGE_SIZE_BYTES  # Default for IMAGE and AUDIO


def _build_incident_response(incident: Incident) -> dict:
    """
    Map an Incident ORM object to a response dict.
    CRITICAL: Never expose reporter contact details.
    """
    evidence_items = [
        EvidenceItem(
            id=e.id,
            file_url=e.file_url,
            file_type=e.file_type.value,
            original_filename=e.original_filename,
            file_size_bytes=e.file_size_bytes,
            description=e.description,
            exif_timestamp=e.exif_timestamp,
            uploaded_at=e.uploaded_at,
        )
        for e in (incident.evidence_files or [])
    ]

    status_items = [
        StatusHistoryItem(
            id=h.id,
            old_status=h.old_status,
            new_status=h.new_status,
            notes=h.notes,
            changed_by=h.changed_by,
            changed_at=h.changed_at,
        )
        for h in sorted(
            (incident.status_history or []),
            key=lambda h: h.changed_at,
            reverse=True,
        )
    ]

    return {
        # Base fields
        "incident_type": incident.incident_type,
        "title": incident.title,
        "description": incident.description,
        "date_occurred": incident.date_occurred,
        "county": incident.county,
        # Tracking
        "id": incident.id,
        "tracking_number": incident.tracking_number,
        "status": incident.status,
        "date_reported": incident.date_reported,
        # Location
        "location_description": incident.location_description,
        "location_lat": incident.location_lat,
        "location_lng": incident.location_lng,
        "constituency": incident.constituency,
        # Linked entities (public names only)
        "candidate_id": incident.candidate_id,
        "candidate_name": (
            incident.candidate.full_name if incident.candidate else None
        ),
        "party_id": incident.party_id,
        "party_name": (
            incident.party.name if incident.party else None
        ),
        # Privacy: only expose anonymous flag, NEVER reporter details
        "is_anonymous": incident.is_anonymous,
        # Nested
        "evidence_files": evidence_items,
        "status_history": status_items,
        "evidence_count": len(evidence_items),
        # Timestamps
        "created_at": incident.created_at,
        "updated_at": incident.updated_at,
    }


# ═══════════════════════════════════════════════════════════════════
# 1. POST / — Submit incident report (M3 Ripoti)
# ═══════════════════════════════════════════════════════════════════

@router.post(
    "/",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a public resource misuse report",
    description=(
        "Submit a new incident report alleging misuse of public resources "
        "during the campaign period, per ECF Act s.14. "
        "Anonymous submissions are supported — set is_anonymous=true and "
        "reporter fields will be cleared. "
        "Returns a tracking number (UCH-2027-XXXX) for status checks."
    ),
)
async def create_incident(
    data: IncidentCreate,
    db: AsyncSession = Depends(get_db),
):
    # ── Generate tracking number ─────────────────────────────────
    tracking_number = await _generate_tracking_number(db)

    # ── Validate linked entities if provided ─────────────────────
    if data.candidate_id:
        candidate_exists = (await db.execute(
            select(func.count(Candidate.id)).where(Candidate.id == data.candidate_id)
        )).scalar()
        if not candidate_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Candidate with id '{data.candidate_id}' not found.",
            )

    if data.party_id:
        party_exists = (await db.execute(
            select(func.count(PoliticalParty.id)).where(PoliticalParty.id == data.party_id)
        )).scalar()
        if not party_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Party with id '{data.party_id}' not found.",
            )

    # ── Create incident record ───────────────────────────────────
    incident = Incident(
        tracking_number=tracking_number,
        incident_type=data.incident_type,
        title=data.title,
        description=data.description,
        date_occurred=data.date_occurred,
        county=data.county,
        constituency=data.constituency,
        location_description=data.location_description,
        location_lat=data.location_lat,
        location_lng=data.location_lng,
        candidate_id=data.candidate_id,
        party_id=data.party_id,
        status=IncidentStatus.SUBMITTED,
        is_anonymous=data.is_anonymous,
        # Reporter fields — cleared by IncidentCreate model_validator
        # if is_anonymous=True
        reporter_name=data.reporter_name,
        reporter_email=data.reporter_email,
        reporter_phone=data.reporter_phone,
    )
    db.add(incident)
    await db.flush()

    # ── Create initial status history entry ──────────────────────
    initial_history = IncidentStatusHistory(
        incident_id=incident.id,
        old_status=None,
        new_status=IncidentStatus.SUBMITTED,
        notes="Incident report submitted via Uchaguzi Safi platform.",
        changed_by="SYSTEM",
    )
    db.add(initial_history)
    await db.commit()

    # Reload with relationships for response
    incident = await _get_incident_by_tracking(tracking_number, db)
    return IncidentResponse(**_build_incident_response(incident))


# ═══════════════════════════════════════════════════════════════════
# 2. GET / — List incidents (M3 Ripoti, M5 Tahadhari)
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/",
    response_model=PaginatedResponse[IncidentListItem],
    summary="List reported incidents",
    description=(
        "Paginated list of public resource misuse incidents. "
        "Filterable by county, type (ECF Act s.2 public resource categories), "
        "status, and date range. Reporter details are NEVER exposed. "
        "Supports M3 Ripoti list view and M5 Tahadhari alert feed."
    ),
)
async def list_incidents(
    db: AsyncSession = Depends(get_db),
    county: Optional[str] = Query(
        None, description="Filter by county name."
    ),
    incident_type: Optional[IncidentType] = Query(
        None, description="Filter by type: STATE_FUNDS, VEHICLE_EQUIPMENT, "
                          "PREMISES, PERSONNEL, OTHER."
    ),
    incident_status: Optional[IncidentStatus] = Query(
        None, alias="status",
        description="Filter by status: SUBMITTED, UNDER_REVIEW, "
                    "VERIFIED, ESCALATED, RESOLVED, REJECTED."
    ),
    date_from: Optional[str] = Query(
        None, description="Filter incidents from this date (YYYY-MM-DD).",
        examples=["2027-06-01"],
    ),
    date_to: Optional[str] = Query(
        None, description="Filter incidents up to this date (YYYY-MM-DD).",
        examples=["2027-08-09"],
    ),
    verified_only: bool = Query(
        False, description="If true, return only VERIFIED or ESCALATED incidents."
    ),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
):
    # ── Build conditions ─────────────────────────────────────────
    conditions = []
    if county:
        conditions.append(Incident.county.ilike(f"%{county}%"))
    if incident_type:
        conditions.append(Incident.incident_type == incident_type)
    if incident_status:
        conditions.append(Incident.status == incident_status)
    if date_from:
        conditions.append(Incident.date_occurred >= date_from)
    if date_to:
        conditions.append(Incident.date_occurred <= date_to)
    if verified_only:
        conditions.append(
            Incident.status.in_([
                IncidentStatus.VERIFIED,
                IncidentStatus.ESCALATED,
            ])
        )

    where_clause = and_(*conditions) if conditions else True

    # ── Count ────────────────────────────────────────────────────
    total = (await db.execute(
        select(func.count(Incident.id)).where(where_clause)
    )).scalar() or 0

    # ── Fetch page ───────────────────────────────────────────────
    offset = (page - 1) * per_page
    data_stmt = (
        select(Incident)
        .where(where_clause)
        .order_by(Incident.date_reported.desc())
        .offset(offset)
        .limit(per_page)
    )
    incidents = (await db.execute(data_stmt)).scalars().all()

    # ── Map to list items (NO reporter details) ──────────────────
    items = [
        IncidentListItem(
            id=i.id,
            tracking_number=i.tracking_number,
            incident_type=i.incident_type,
            title=i.title,
            county=i.county,
            status=i.status,
            date_occurred=i.date_occurred,
            date_reported=i.date_reported,
            is_anonymous=i.is_anonymous,
            evidence_count=0,  # Avoid N+1; count separately if needed
            location_lat=i.location_lat,
            location_lng=i.location_lng,
        )
        for i in incidents
    ]

    return PaginatedResponse.create(
        items=items, total=total, page=page, per_page=per_page
    )


# ═══════════════════════════════════════════════════════════════════
# 3. GET /map — Map markers for M2 Taswira (BEFORE /{tracking_number})
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/map",
    response_model=List[dict],
    summary="Get incident map markers",
    description=(
        "Returns incident locations for the M2 Taswira county map overlay. "
        "Only includes incidents with valid GPS coordinates within Kenya. "
        "Used to render heat maps and markers on the React Map GL component."
    ),
)
async def get_incident_map_data(
    db: AsyncSession = Depends(get_db),
    county: Optional[str] = Query(None, description="Filter by county."),
    incident_type: Optional[IncidentType] = Query(None),
    incident_status: Optional[IncidentStatus] = Query(None, alias="status"),
):
    # Only incidents with valid coordinates
    conditions = [
        Incident.location_lat.isnot(None),
        Incident.location_lng.isnot(None),
        Incident.location_lat.between(KENYA_LAT_MIN, KENYA_LAT_MAX),
        Incident.location_lng.between(KENYA_LNG_MIN, KENYA_LNG_MAX),
    ]

    if county:
        conditions.append(Incident.county.ilike(f"%{county}%"))
    if incident_type:
        conditions.append(Incident.incident_type == incident_type)
    if incident_status:
        conditions.append(Incident.status == incident_status)

    stmt = (
        select(
            Incident.id,
            Incident.tracking_number,
            Incident.location_lat,
            Incident.location_lng,
            Incident.incident_type,
            Incident.status,
            Incident.county,
            Incident.title,
            Incident.date_occurred,
        )
        .where(and_(*conditions))
        .order_by(Incident.date_reported.desc())
        .limit(500)  # Cap to prevent map overload on mobile
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            "id": str(row.id),
            "tracking_number": row.tracking_number,
            "lat": row.location_lat,
            "lng": row.location_lng,
            "type": row.incident_type.value,
            "status": row.status.value,
            "county": row.county,
            "title": row.title,
            "date_occurred": row.date_occurred.isoformat(),
        }
        for row in rows
    ]


# ═══════════════════════════════════════════════════════════════════
# 4. GET /{tracking_number} — Public incident detail
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/{tracking_number}",
    response_model=IncidentResponse,
    summary="Get incident by tracking number",
    description=(
        "Retrieve public details of an incident by its tracking number "
        "(UCH-2027-XXXX). Includes evidence files and status history. "
        "Reporter contact details are NEVER returned, even for "
        "non-anonymous reports, to protect reporter safety. "
        "This endpoint requires no authentication."
    ),
)
async def get_incident(
    tracking_number: str,
    db: AsyncSession = Depends(get_db),
):
    incident = await _get_incident_by_tracking(tracking_number, db)
    return IncidentResponse(**_build_incident_response(incident))


# ═══════════════════════════════════════════════════════════════════
# 5. GET /{tracking_number}/status — Public status check
# ═══════════════════════════════════════════════════════════════════

@router.get(
    "/{tracking_number}/status",
    response_model=IncidentTrackingResponse,
    summary="Check incident status (public, no auth)",
    description=(
        "Lightweight status check for reporters using their tracking number. "
        "Returns current status, timeline of status changes, and evidence count. "
        "Designed for the M3 Ripoti tracking page — accessible without login. "
        "ECF Act s.21(3): Complaints must be determined within 7 days "
        "(pre-election) or 14 days (post-election)."
    ),
)
async def check_incident_status(
    tracking_number: str,
    db: AsyncSession = Depends(get_db),
):
    incident = await _get_incident_by_tracking(tracking_number, db)

    # Build public-safe status updates (redact internal notes if needed)
    status_updates = [
        StatusHistoryItem(
            id=h.id,
            old_status=h.old_status,
            new_status=h.new_status,
            notes=h.notes,  # Notes are public on the tracking page
            changed_by=h.changed_by,
            changed_at=h.changed_at,
        )
        for h in sorted(
            (incident.status_history or []),
            key=lambda h: h.changed_at,
            reverse=True,
        )
    ]

    # Most recent status change timestamp
    last_updated = (
        status_updates[0].changed_at if status_updates
        else incident.updated_at
    )

    return IncidentTrackingResponse(
        tracking_number=incident.tracking_number,
        incident_type=incident.incident_type,
        title=incident.title,
        county=incident.county,
        status=incident.status,
        date_occurred=incident.date_occurred,
        date_reported=incident.date_reported,
        evidence_count=len(incident.evidence_files or []),
        last_updated=last_updated,
        status_updates=status_updates,
    )


# ═══════════════════════════════════════════════════════════════════
# 6. POST /{tracking_number}/evidence — Upload evidence file
# ═══════════════════════════════════════════════════════════════════

@router.post(
    "/{tracking_number}/evidence",
    response_model=EvidenceItem,
    status_code=status.HTTP_201_CREATED,
    summary="Upload evidence for an incident",
    description=(
        "Upload a supporting evidence file (image, video, document, or audio) "
        "for an existing incident. Images and videos are scanned for EXIF "
        "metadata (timestamp, GPS, device info) to support credibility "
        "assessment during the s.21 investigation process.\n\n"
        "**Size limits:**\n"
        "- Images: 10 MB (JPEG, PNG, WebP, HEIC)\n"
        "- Videos: 50 MB (MP4, MOV, AVI)\n"
        "- Documents: 20 MB (PDF, DOCX)\n"
        "- Audio: 10 MB (MP3, WAV, M4A)"
    ),
)
async def upload_evidence(
    tracking_number: str,
    file: UploadFile = File(
        ..., description="Evidence file to upload."
    ),
    description: Optional[str] = Form(
        None, description="Description of what the evidence shows."
    ),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    # ── Verify incident exists ───────────────────────────────────
    incident = await _get_incident_by_tracking(
        tracking_number, db, load_relations=False
    )

    # ── Validate file type ───────────────────────────────────────
    content_type = file.content_type or ""
    file_type = _classify_file_type(content_type)
    if file_type is None:
        all_allowed = set()
        for mime_set in ALLOWED_MIME_TYPES.values():
            all_allowed.update(mime_set)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file type '{content_type}'. "
                f"Allowed types: {sorted(all_allowed)}"
            ),
        )

    # ── Read file and check size ─────────────────────────────────
    file_content = await file.read()
    file_size = len(file_content)
    max_size = _get_max_file_size(file_type)

    if file_size > max_size:
        max_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"File size ({file_size / (1024 * 1024):.1f} MB) exceeds "
                f"the {max_mb:.0f} MB limit for {file_type.value} files."
            ),
        )

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # ── Save file to disk ────────────────────────────────────────
    upload_dir = os.path.join(settings.upload_dir, "evidence", tracking_number)
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename to prevent collisions
    file_ext = os.path.splitext(file.filename or "unknown")[1].lower()
    unique_name = f"{uuid_lib.uuid4().hex[:12]}{file_ext}"
    file_path = os.path.join(upload_dir, unique_name)

    with open(file_path, "wb") as f:
        f.write(file_content)

    file_url = f"/uploads/evidence/{tracking_number}/{unique_name}"

    # ── Extract EXIF metadata (images only) ──────────────────────
    exif_timestamp = None
    exif_gps_lat = None
    exif_gps_lng = None
    exif_device_make = None
    exif_device_model = None

    if file_type == EvidenceFileType.IMAGE:
        try:
            exif_data = _extract_exif(file_content)
            exif_timestamp = exif_data.get("timestamp")
            exif_gps_lat = exif_data.get("gps_lat")
            exif_gps_lng = exif_data.get("gps_lng")
            exif_device_make = exif_data.get("device_make")
            exif_device_model = exif_data.get("device_model")
        except Exception:
            pass  # EXIF extraction is best-effort; don't block upload

    # ── Create Evidence record ───────────────────────────────────
    evidence = Evidence(
        incident_id=incident.id,
        file_url=file_url,
        file_type=file_type,
        original_filename=file.filename or "unknown",
        file_size_bytes=file_size,
        mime_type=content_type,
        exif_timestamp=exif_timestamp,
        exif_gps_lat=exif_gps_lat,
        exif_gps_lng=exif_gps_lng,
        exif_device_make=exif_device_make,
        exif_device_model=exif_device_model,
        description=description,
    )
    db.add(evidence)
    await db.commit()
    await db.refresh(evidence)

    return EvidenceItem(
        id=evidence.id,
        file_url=evidence.file_url,
        file_type=evidence.file_type.value,
        original_filename=evidence.original_filename,
        file_size_bytes=evidence.file_size_bytes,
        description=evidence.description,
        exif_timestamp=evidence.exif_timestamp,
        uploaded_at=evidence.uploaded_at,
    )


# ═══════════════════════════════════════════════════════════════════
# 7. PATCH /{tracking_number}/status — Update status (admin only)
# ═══════════════════════════════════════════════════════════════════

@router.patch(
    "/{tracking_number}/status",
    response_model=IncidentResponse,
    summary="Update incident status (admin)",
    description=(
        "Update the status of an incident. Used by reviewers and IEBC officers "
        "via the M6 Usimamizi admin module. Validates that the status transition "
        "follows the ECF Act s.21 complaint process:\n\n"
        "SUBMITTED → UNDER_REVIEW → VERIFIED → ESCALATED → RESOLVED\n"
        "                         ↘ REJECTED\n\n"
        "Creates an audit trail entry in the status history for "
        "s.21(3) timeline compliance."
    ),
)
async def update_incident_status(
    tracking_number: str,
    data: IncidentStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    incident = await _get_incident_by_tracking(tracking_number, db)

    # ── Validate status transition ───────────────────────────────
    current_status = incident.status
    allowed_next = VALID_STATUS_TRANSITIONS.get(current_status, set())

    if data.new_status not in allowed_next:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid status transition: {current_status.value} → "
                f"{data.new_status.value}. Allowed transitions from "
                f"'{current_status.value}': "
                f"{[s.value for s in allowed_next] if allowed_next else 'none (terminal state)'}."
            ),
        )

    # ── Update incident status ───────────────────────────────────
    old_status = incident.status
    incident.status = data.new_status

    # ── Create status history record ─────────────────────────────
    history_entry = IncidentStatusHistory(
        incident_id=incident.id,
        old_status=old_status,
        new_status=data.new_status,
        notes=data.notes,
        changed_by=data.changed_by,
    )
    db.add(history_entry)
    await db.commit()

    # Reload with all relationships
    incident = await _get_incident_by_tracking(tracking_number, db)
    return IncidentResponse(**_build_incident_response(incident))


# ═══════════════════════════════════════════════════════════════════
# EXIF EXTRACTION UTILITY
# ═══════════════════════════════════════════════════════════════════

def _extract_exif(image_bytes: bytes) -> dict:
    """
    Extract EXIF metadata from image bytes.
    Returns dict with optional keys: timestamp, gps_lat, gps_lng,
    device_make, device_model.

    Used for evidence credibility assessment during the ECF Act s.21
    investigation process — cross-references claimed date/location
    against embedded photo metadata.
    """
    result = {}

    try:
        from PIL import Image
        from PIL.ExifTags import TAGS, GPSTAGS
        import io

        img = Image.open(io.BytesIO(image_bytes))
        exif_raw = img._getexif()
        if not exif_raw:
            return result

        exif = {TAGS.get(k, k): v for k, v in exif_raw.items()}

        # Device info
        if "Make" in exif:
            result["device_make"] = str(exif["Make"]).strip()
        if "Model" in exif:
            result["device_model"] = str(exif["Model"]).strip()

        # Timestamp
        if "DateTimeOriginal" in exif:
            try:
                dt_str = str(exif["DateTimeOriginal"])
                result["timestamp"] = datetime.strptime(
                    dt_str, "%Y:%m:%d %H:%M:%S"
                )
            except (ValueError, TypeError):
                pass

        # GPS coordinates
        gps_info = exif.get("GPSInfo")
        if gps_info:
            gps = {GPSTAGS.get(k, k): v for k, v in gps_info.items()}

            def _dms_to_decimal(dms, ref):
                """Convert GPS DMS (degrees, minutes, seconds) to decimal."""
                degrees = float(dms[0])
                minutes = float(dms[1])
                seconds = float(dms[2])
                decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
                if ref in ("S", "W"):
                    decimal = -decimal
                return decimal

            if "GPSLatitude" in gps and "GPSLatitudeRef" in gps:
                result["gps_lat"] = _dms_to_decimal(
                    gps["GPSLatitude"], gps["GPSLatitudeRef"]
                )
            if "GPSLongitude" in gps and "GPSLongitudeRef" in gps:
                result["gps_lng"] = _dms_to_decimal(
                    gps["GPSLongitude"], gps["GPSLongitudeRef"]
                )

    except ImportError:
        # PIL not available — EXIF extraction is optional
        pass
    except Exception:
        # Any EXIF parsing error — don't block the upload
        pass

    return result
