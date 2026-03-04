# =============================================================================
# ADD THIS TO THE BOTTOM OF backend/app/main.py
# (Before the final router registration section)
#
# This serves the React frontend build from /static in production.
# In development (Vite dev server), this code is inactive because
# the /static directory does not exist.
# =============================================================================

import os
from pathlib import Path

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# ── Serve React Frontend (Production Only) ───────────────────────────
# The Dockerfile copies the built frontend into /app/static/.
# FastAPI serves it as static files, with a catch-all for SPA routing.
STATIC_DIR = Path(__file__).parent.parent / "static"

if STATIC_DIR.exists():
    # Serve JS, CSS, images from /assets
    app.mount(
        "/assets",
        StaticFiles(directory=STATIC_DIR / "assets"),
        name="static-assets",
    )

    # Serve GeoJSON and other public data files
    if (STATIC_DIR / "data").exists():
        app.mount(
            "/data",
            StaticFiles(directory=STATIC_DIR / "data"),
            name="static-data",
        )

    # SPA catch-all: any route not matching /api or /health
    # returns index.html so React Router handles client-side routing
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """
        Catch-all route for React SPA.
        Returns index.html for all non-API, non-static paths.
        React Router then handles client-side routing.
        """
        # If the file exists in static dir, serve it directly
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        # Otherwise, return index.html for SPA routing
        return FileResponse(STATIC_DIR / "index.html")
