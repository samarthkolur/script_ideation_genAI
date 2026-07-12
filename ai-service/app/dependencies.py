"""Shared FastAPI dependencies — currently just the server-to-server auth
check every /internal/* route requires. This service is never meant to be
reachable from a browser (design.md DD-007); the shared secret is the
enforcement of that boundary, not a substitute for network-level isolation
in a real deployment.
"""

from __future__ import annotations

from fastapi import Header, HTTPException

from app.config import get_settings


async def verify_shared_secret(x_internal_secret: str | None = Header(default=None)) -> None:
    settings = get_settings()
    if settings.ai_service_shared_secret is None:
        return  # local dev without a configured secret — not for production use
    if x_internal_secret != settings.ai_service_shared_secret:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Internal-Secret header")
