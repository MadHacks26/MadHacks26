from typing import Optional

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, Field
from firebase_admin import auth

from google.cloud.firestore_v1 import SERVER_TIMESTAMP

from db.firebase import db

router = APIRouter(prefix="/api/auth", tags=["auth"])

USERS_COLLECTION = "users"


class AuthRequest(BaseModel):
    user_id: str = Field(..., min_length=1, description="Unique user identifier")
    user_name: str = Field(..., min_length=1, description="Display name")
    email: str = Field(..., min_length=1, description="User email")


class UserResponse(BaseModel):
    user_id: str
    user_name: str
    email: str
    created_at: Optional[str] = None


@router.post("", response_model=UserResponse)
def create_or_update_user(req: AuthRequest):
    """Create or update a user in Firestore. Creates on first registration with created_at."""
    try:
        user_id = req.user_id.strip()
        user_name = req.user_name.strip()
        user_email = req.email.strip()
        doc_ref = db.collection(USERS_COLLECTION).document(user_id)
        doc = doc_ref.get()

        if not doc.exists:
            doc_ref.set(
                {
                    "user_id": user_id,
                    "user_name": user_name,
                    "user_email": user_email,
                    "created_at": SERVER_TIMESTAMP,
                }
            )
            created_at = None
        else:
            doc_ref.update(
                {
                    "user_name": user_name,
                    "user_email": user_email,
                }
            )
            data = doc.to_dict()
            created_at = data.get("created_at")
            if hasattr(created_at, "isoformat"):
                created_at = created_at.isoformat()
            elif created_at is not None:
                created_at = str(created_at)

        return UserResponse(
            user_id=user_id,
            user_name=user_name,
            email=user_email,
            created_at=created_at,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str):
    """Get user details by user_id."""
    try:
        doc_ref = db.collection(USERS_COLLECTION).document(user_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        data = doc.to_dict()
        email_val = data.get("user_email") or data.get("email", "")
        created_at = data.get("created_at")
        if hasattr(created_at, "isoformat"):
            created_at = created_at.isoformat()
        elif created_at is not None:
            created_at = str(created_at)
        return UserResponse(
            user_id=data["user_id"],
            user_name=data["user_name"],
            email=email_val,
            created_at=created_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def verify_firebase_token(authorization: str = Header(...)):
    """
    Expect header:
    Authorization: Bearer <ID_TOKEN>
    """
    try:
        token = authorization.split(" ")[1]
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.get("/auth")
def protected_route(user=Depends(verify_firebase_token)):
    return {
        "message": "You are authenticated",
        "user_id": user["uid"],
        "email": user.get("email")
    }