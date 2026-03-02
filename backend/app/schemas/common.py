"""
UCHAGUZI SAFI — Common Schemas
=================================
Shared Pydantic models for pagination, standard responses, and
reusable types across all API endpoints.

These support the mobile-first design by enabling configurable
page sizes — smaller pages for mobile users on constrained
bandwidth, larger pages for desktop/journalist workflows.
"""

from datetime import datetime
from math import ceil
from typing import Generic, List, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# Generic type for paginated items
T = TypeVar("T")


# ═══════════════════════════════════════════════════════════════════
# PAGINATION
# ═══════════════════════════════════════════════════════════════════

class PaginationParams(BaseModel):
    """
    Query parameters for paginated endpoints.
    Defaults are mobile-friendly (10 items per page).
    """

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{"page": 1, "per_page": 10}]
        }
    )

    page: int = Field(
        default=1,
        ge=1,
        description="Page number (1-indexed).",
        examples=[1],
    )
    per_page: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Items per page. Default 10 (mobile-optimised). "
                    "Max 100 for bulk data export workflows.",
        examples=[10],
    )

    @property
    def offset(self) -> int:
        """SQLAlchemy offset for LIMIT/OFFSET queries."""
        return (self.page - 1) * self.per_page


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Standard paginated response wrapper.
    Used across all list endpoints (candidates, contributions,
    expenditures, incidents).
    """

    model_config = ConfigDict(from_attributes=True)

    items: List[T] = Field(description="Page of results.")
    total: int = Field(description="Total number of matching records.", examples=[47])
    page: int = Field(description="Current page number.", examples=[1])
    per_page: int = Field(description="Items per page.", examples=[10])
    pages: int = Field(description="Total number of pages.", examples=[5])

    @classmethod
    def create(cls, items: List[T], total: int, page: int, per_page: int):
        """Factory method to construct a paginated response."""
        return cls(
            items=items,
            total=total,
            page=page,
            per_page=per_page,
            pages=ceil(total / per_page) if per_page > 0 else 0,
        )


# ═══════════════════════════════════════════════════════════════════
# STANDARD RESPONSE WRAPPERS
# ═══════════════════════════════════════════════════════════════════

class MessageResponse(BaseModel):
    """Simple message response for confirmations and errors."""
    message: str = Field(description="Human-readable message.", examples=["Operation successful."])
    detail: Optional[str] = Field(default=None, description="Additional detail if applicable.")


class HealthResponse(BaseModel):
    """Health check response for /health endpoint."""

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{
                "status": "healthy",
                "service": "Uchaguzi Safi",
                "version": "0.1.0",
                "environment": "development",
            }]
        }
    )

    status: str = Field(description="Service status.", examples=["healthy"])
    service: str = Field(description="Service name.", examples=["Uchaguzi Safi"])
    version: str = Field(description="API version.", examples=["0.1.0"])
    environment: str = Field(description="Deployment environment.", examples=["development"])


# ═══════════════════════════════════════════════════════════════════
# SHARED TYPES
# ═══════════════════════════════════════════════════════════════════

class TimestampMixin(BaseModel):
    """Audit timestamp fields present on all database entities."""
    created_at: datetime = Field(description="Record creation timestamp (UTC).")
    updated_at: datetime = Field(description="Last modification timestamp (UTC).")


class UUIDMixin(BaseModel):
    """UUID primary key field."""
    id: UUID = Field(description="Unique identifier (UUID v4).")
