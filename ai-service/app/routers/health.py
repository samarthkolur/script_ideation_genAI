"""Unauthenticated health check — used by the BFF and any deployment
platform's liveness probe. Reports which provider is active so a `curl` is
enough to confirm the service is pointed at mock vs. real NIM.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.config import get_settings

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    settings = get_settings()
    return {"status": "ok", "provider": settings.model_provider}
