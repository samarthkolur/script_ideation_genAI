"""AI service entrypoint. Mounts every router; the only cross-cutting
concern here is which routes are public (health) vs. internal/authenticated
(generate, refine, validate — see dependencies.py). This service is called
exclusively by the Next.js BFF, never by the browser (design.md DD-007).
"""

from __future__ import annotations

from fastapi import FastAPI

from app.routers import generate, health, refine, validate

app = FastAPI(
    title="PS241 AI Service",
    description="Internal-only NVIDIA NIM orchestration service behind the Next.js BFF.",
    version="0.1.0",
)

app.include_router(health.router)
app.include_router(generate.router)
app.include_router(refine.router)
app.include_router(validate.router)
