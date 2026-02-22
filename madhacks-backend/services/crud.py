"""
DB dump format: { user_id: { "roadmaps": { company_name: json } } }
Stores roadmap JSON in Firestore at users/{user_id} with structure:
{ roadmaps: { [company_name]: roadmap_json } }
"""

from typing import Any

from db.firebase import db

USERS_COLLECTION = "users"


def save_roadmap_dump(
    user_id: str, company_name: str, roadmap_json: dict[str, Any]
) -> None:
    """Save roadmap JSON to Firestore under users/{user_id}.roadmaps.{company_name}."""
    doc_ref = db.collection(USERS_COLLECTION).document(user_id)
    doc = doc_ref.get()

    existing_roadmaps = (doc.to_dict() or {}).get("roadmaps", {}) if doc.exists else {}
    roadmaps = {**existing_roadmaps, company_name: roadmap_json}

    doc_ref.set({"roadmaps": roadmaps}, merge=True)


def get_roadmaps_by_user_id(
    user_id: str,
) -> dict[str, dict[str, dict[str, Any]]]:
    """
    Fetch all roadmaps for a user.
    Returns format: { user_id: { "roadmaps": { company_name: json } } }
    """
    doc_ref = db.collection(USERS_COLLECTION).document(user_id)
    doc = doc_ref.get()

    roadmaps = (doc.to_dict() or {}).get("roadmaps", {}) if doc.exists else {}
    return {user_id: {"roadmaps": roadmaps}}
