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


from typing import Dict


def get_urls_for_user(user_id: str) -> Dict[str, Dict[str, bool]]:
    doc_ref = db.collection(USERS_COLLECTION).document(user_id)
    doc = doc_ref.get()

    if not doc.exists:
        return {"urls": {}}

    data = doc.to_dict() or {}
    urls = data.get("urls", {})

    if not isinstance(urls, dict):
        return {"urls": {}}

    # Ensure clean output
    cleaned_urls = {
        str(k): bool(v)
        for k, v in urls.items()
        if isinstance(k, str)
    }

    return {"urls": cleaned_urls}

def extract_urls_and_update_db(
    user_id: str,
    roadmap_json: Dict[str, Any]
) -> None:
    """
    Extract URLs from roadmap JSON and update Firestore.

    - Adds only new URLs
    - Preserves existing checked state
    - Does not return anything
    """

    # 🔹 Step 1: Extract URLs from roadmap
    extracted_urls: set[str] = set()
    print("HERE")
    roadmap = roadmap_json.get("roadmap", [])
    if not isinstance(roadmap, list):
        return
    print(roadmap)
    for day_obj in roadmap:
        if not isinstance(day_obj, dict):
            continue

        checklist = day_obj.get("checklist", [])
        if not isinstance(checklist, list):
            continue

        for item in checklist:
            if not isinstance(item, dict):
                continue

            url = item.get("url")
            if isinstance(url, str):
                cleaned = url.strip()
                if cleaned:
                    extracted_urls.add(cleaned)
    print(extracted_urls)
    if not extracted_urls:
        return

    # 🔹 Step 2: Fetch existing user URLs
    doc_ref = db.collection(USERS_COLLECTION).document(user_id)
    doc = doc_ref.get()

    existing_urls = {}
    if doc.exists:
        data = doc.to_dict() or {}
        existing_urls = data.get("urls", {})
        if not isinstance(existing_urls, dict):
            existing_urls = {}
    print(existing_urls)

    # 🔹 Step 4: Write to Firestore only if needed
    if existing_urls != {}:
        updates = {}
        for url in extracted_urls:
            if url not in existing_urls:
                updates[f"urls.{url}"] = False
    else:
        doc_ref.set({"urls": {url: False for url in extracted_urls}}, merge=True)