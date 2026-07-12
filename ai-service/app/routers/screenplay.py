from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.providers.registry import get_provider
from app.dependencies import verify_shared_secret
from app.schemas import ScreenplayRequest, ScreenplayResponse

router = APIRouter(dependencies=[Depends(verify_shared_secret)])


@router.post("/internal/screenplay", response_model=ScreenplayResponse)
async def screenplay(request: ScreenplayRequest) -> ScreenplayResponse:
    provider = get_provider(request.provider)
    try:
        excerpt = await provider.generate_screenplay(
            request.brief, request.variant, request.scene_target
        )
    except Exception as exc:  # noqa: BLE001 - surfaced as a clean 502 to the BFF
        raise HTTPException(status_code=502, detail=f"{provider.name} provider error: {exc}") from exc
    return ScreenplayResponse(screenplay_excerpt=excerpt, model=provider.model_name, provider=provider.name)
