"""
UCHAGUZI SAFI — Application Configuration
==========================================
Centralised settings loaded from environment variables.
Legal constants derived from the Election Campaign Financing Act, Cap. 7A (2013).

Key ECF Act references embedded here:
  - s.12(1)–(3): Contribution limits and disclosure thresholds
  - s.16(1):     Receipt threshold (KES 20,000)
  - s.18:        Spending limits (set by IEBC gazette notice)
  - s.22–24:     Penalty ceilings (KES 2,000,000 / 5 years)
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings sourced from environment variables or .env file.
    All defaults are safe for local development; production values MUST
    be injected via environment.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────
    app_name: str = "Uchaguzi Safi"
    app_version: str = "0.1.0"
    app_description: str = (
        "Campaign Finance Transparency Tool — Kenya 2027 Elections"
    )
    DEBUG: bool = False
    environment: str = "production"

    # ── Database ─────────────────────────────────────────────────────
    database_url: str = (
        "postgresql+asyncpg://postgres:password@localhost:5432/uchaguzi_safi"
    )
    database_url_sync: str = (
        "postgresql://postgres:password@localhost:5432/uchaguzi_safi"
    )

    # ── Authentication (JWT) ─────────────────────────────────────────
    secret_key: str = "CHANGE-ME-generate-a-secure-random-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # ── CORS ─────────────────────────────────────────────────────────
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated origins into a list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    # ── Kenya / ECF Act Regulatory Constants ─────────────────────────
    # These mirror statutory provisions and IEBC gazette notices.

    default_currency: str = "KES"

    # ECF Act s.16(1): Receipts required for contributions above this amount
    contribution_disclosure_threshold: int = 20_000

    # ECF Act s.12(2): No single source may exceed 20% of total contributions
    single_source_contribution_cap_percent: int = 20

    # ECF Act s.22, s.23, s.24: Maximum fine on conviction
    max_fine_kes: int = 2_000_000

    # ── File Uploads ─────────────────────────────────────────────────
    max_upload_size_mb: int = 10
    upload_dir: str = "./uploads"

    # ── Logging ──────────────────────────────────────────────────────
    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    """
    Cached singleton so settings are read once per process.
    Use dependency injection in routes:  settings = Depends(get_settings)
    """
    return Settings()
