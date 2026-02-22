from typing import Any

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from auth import verify_firebase_token
from services.crud import (
    save_roadmap_dump,
    get_roadmaps_by_user_id,
    extract_urls_and_update_db,
    get_url_status,
    set_url_status
)

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])


class SaveRoadmapRequest(BaseModel):
    company_name: str = Field(..., min_length=1, description="Company name for the roadmap")
    roadmap_json: dict[str, Any] = Field(..., description="Full roadmap JSON to save")


class ExtractUrlsRequest(BaseModel):
    roadmap_json: dict[str, Any] = Field(..., description="Roadmap with roadmap[].checklist[].url")


class GetItemRequest(BaseModel):
    url: str = Field(..., description="URL to get status for")


class SaveItemRequest(BaseModel):
    url: str = Field(..., description="URL to update")
    checked: bool = Field(..., description="Checked status")


@router.post("/save")
def save_roadmap(
    req: SaveRoadmapRequest,
    user: dict = Depends(verify_firebase_token),
):
    """Save a roadmap to Firebase under the authenticated user."""
    try:
        user_id = user["uid"]
        save_roadmap_dump(user_id, req.company_name.strip(), req.roadmap_json)
        extract_urls_and_update_db(user_id, req.roadmap_json)

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

@router.post("/getitem")
def get_roadmap_item(
    req: GetItemRequest,

    user: dict = Depends(verify_firebase_token),
):
    try:
        user_id = user['uid']
        status = get_url_status(user_id, req.url)
        return {"url": req.url, "checked": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/putitem")
def save_roadmap_item(
    req: SaveItemRequest,

    user: dict = Depends(verify_firebase_token),
):
    try:
        user_id = user['uid']
        set_url_status(user_id, req.url, req.checked)
        return {"ok": True, "message": "Item updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))