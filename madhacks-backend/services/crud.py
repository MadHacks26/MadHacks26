"""
DB dump format: { user_id: { "roadmaps": { company_name: json } } }
Stores roadmap JSON in Firestore at users/{user_id} with structure:
{ roadmaps: { [company_name]: roadmap_json } }
"""

from typing import Any, Dict, List

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

    # get the existing urls and parse the roadmap
    existing_urls = get_urls_for_user(user_id)

    # For each roadmap, iterate over each day's checklist and augment with 'checked' if URL exists in existing_urls
    for company, roadmap_json in roadmaps.items():
        roadmap_list = roadmap_json.get("roadmap", [])
        if not isinstance(roadmap_list, list):
            continue
        for day_obj in roadmap_list:
            if not isinstance(day_obj, dict):
                continue
            checklist = day_obj.get("checklist", [])
            if not isinstance(checklist, list):
                continue
            for item in checklist:
                if not isinstance(item, dict):
                    continue
                url = item.get("url")
                if isinstance(url, str) and url in existing_urls:
                    item["checked"] = existing_urls[url]


    return {user_id: {"roadmaps": roadmaps}}


from typing import Dict


def get_urls_for_user(user_id: str) -> Dict[str, bool]:
    doc_ref = db.collection(USERS_COLLECTION).document(user_id)
    doc = doc_ref.get()

    existing_urls_list: List[Dict[str, Any]] = []

    if doc.exists:
        data = doc.to_dict() or {}
        urls_field = data.get("urls", [])
        if isinstance(urls_field, list):
            existing_urls_list = [
                item for item in urls_field
                if isinstance(item, dict) and "url" in item
            ]

    existing_url_map = {
        item["url"]: bool(item.get("checked", False))
        for item in existing_urls_list
        if isinstance(item.get("url"), str)
    }

    return existing_url_map

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
    roadmap = roadmap_json.get("roadmap", [])
    if not isinstance(roadmap, list):
        return
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
    if not extracted_urls:
        return

    # 🔹 Step 2: Fetch existing user URLs
    doc_ref = db.collection(USERS_COLLECTION).document(user_id)
    doc = doc_ref.get()

    existing_urls = get_urls_for_user(user_id)

    new_entries = [
        {"url": url, "checked": False}
        for url in extracted_urls
        if url not in existing_urls
    ]

    existing_urls_list = [{"url": url, "checked": checked} for url, checked in existing_urls.keys()]

    updated_urls = existing_urls_list + new_entries

    # 🔹 Step 5: Write back merged array
    doc_ref.set(
        {"urls": updated_urls},
        merge=True
    )


def get_url_status(user_id: str, url: str) -> bool:
    if not url or not isinstance(url, str):
        return False

    existing_urls = get_urls_for_user(user_id)
    
    return existing_urls.get(url)

def set_url_status(user_id: str, url: str, checked: bool) -> None:
    if not url or not isinstance(url, str):
        return False
    
    doc_ref = db.collection(USERS_COLLECTION).document(user_id)
    doc = doc_ref.get()

    if not doc.exists:
        return None

    existing_urls = get_urls_for_user(user_id)
    existing_urls_list = [{"url": u, "checked": c} for u, c in existing_urls.items() if u != url]
    existing_urls_list.append({"url": url, "checked": checked})

    doc_ref.set(
        {"urls": existing_urls_list},
        merge=True
    )
    