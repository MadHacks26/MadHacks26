from typing import Any

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from auth import verify_firebase_token
from services.crud import save_roadmap_dump, get_roadmaps_by_user_id

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])


class SaveRoadmapRequest(BaseModel):
    company_name: str = Field(..., min_length=1, description="Company name for the roadmap")
    roadmap_json: dict[str, Any] = Field(..., description="Full roadmap JSON to save")


@router.post("/save")
def save_roadmap(
    req: SaveRoadmapRequest,
    user: dict = Depends(verify_firebase_token),
):
    """Save a roadmap to Firebase under the authenticated user."""
    try:
        user_id = user["uid"]
        save_roadmap_dump(user_id, req.company_name.strip(), req.roadmap_json)
        return {"ok": True, "message": "Roadmap saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
def get_roadmaps(user_id : str):
    """Get all roadmaps for the authenticated user."""
    try:
        user_id = user_id
        result = get_roadmaps_by_user_id(user_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
