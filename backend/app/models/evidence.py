"""
UCHAGUZI SAFI — Evidence Model
=================================
Stores metadata for evidence files attached to incidents.
Supports the evidentiary requirements for IEBC complaint
determination under ECF Act s.21(4)(b).

EXIF metadata extraction from photos/videos provides:
  - Timestamp verification (was the photo taken on the claimed date?)
  - GPS verification (was the photo taken at the claimed location?)
These fields support the credibility assessment during review.

Module mapping:
  - M3 Ripoti Ubadhirifu: Evidence upload during incident reporting
"""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    DateTime, Float, ForeignKey, Index, Integer, String,
)
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.incident import Incident


# ═══════════════════════════════════════════════════════════════════
# ENUMERATIONS
# ═══════════════════════════════════════════════════════════════════

class EvidenceFileType(str, enum.Enum):
    """Supported evidence file types."""
    IMAGE = "IMAGE"         # JPEG, PNG, WebP
    VIDEO = "VIDEO"         # MP4, MOV
    DOCUMENT = "DOCUMENT"   # PDF, DOCX
    AUDIO = "AUDIO"         # MP3, WAV — e.g., recorded rally speeches


# ═══════════════════════════════════════════════════════════════════
# MODEL
# ═══════════════════════════════════════════════════════════════════

class Evidence(BaseModel):
    __tablename__ = "evidence"

    # ── Incident Link ────────────────────────────────────────────
    incident_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False,
        doc="FK to the incident this evidence supports.",
    )

    # ── File Metadata ────────────────────────────────────────────
    file_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        doc="Storage URL for the evidence file.",
    )
    file_type: Mapped[EvidenceFileType] = mapped_column(
        ENUM(EvidenceFileType, name="evidence_file_type_enum", create_type=True),
        nullable=False,
        doc="Classification of the uploaded file.",
    )
    original_filename: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
        doc="Original filename as uploaded by the reporter.",
    )
    file_size_bytes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="File size in bytes. Used for storage management.",
    )
    mime_type: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="MIME type of the file (e.g., image/jpeg, video/mp4).",
    )

    # ── EXIF Metadata (extracted server-side for verification) ───
    exif_timestamp: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        doc="Timestamp from the image/video EXIF data. "
            "Cross-referenced against incident.date_occurred for verification.",
    )
    exif_gps_lat: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="GPS latitude from EXIF data. Cross-referenced against "
            "incident.location_lat for location verification.",
    )
    exif_gps_lng: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        doc="GPS longitude from EXIF data.",
    )
    exif_device_make: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Camera/device manufacturer from EXIF (e.g., Samsung, Apple).",
    )
    exif_device_model: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Camera/device model from EXIF.",
    )

    # ── Upload Metadata ──────────────────────────────────────────
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default="now()",
        doc="Timestamp when the file was uploaded to the system.",
    )
    description: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="Reporter's description of what the evidence shows.",
    )

    # ── Relationships ────────────────────────────────────────────
    incident: Mapped["Incident"] = relationship(
        "Incident",
        back_populates="evidence_files",
        doc="The incident this evidence supports.",
    )

    # ── Indexes ──────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_evidence_incident_id", "incident_id"),
        Index("ix_evidence_file_type", "file_type"),
        {"comment": "Evidence files supporting incident reports. "
                     "EXIF metadata used for verification (M3 Ripoti)."},
    )

    def __repr__(self) -> str:
        return (
            f"<Evidence(file='{self.original_filename}', "
            f"type={self.file_type.value})>"
        )
