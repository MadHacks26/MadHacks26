import os
import time
import json
from datetime import datetime

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

def generate(job_description: str = "Software Engineer 1", api_key: str | None = None):
    """Generate content using the streaming API with Google Search and types."""
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        raise ValueError("Provide api_key or set GEMINI_API_KEY environment variable")

    client = genai.Client(api_key=key)

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=job_description)],
        ),
    ]
    tools = [
        types.Tool(url_context=types.UrlContext()),
        types.Tool(googleSearch=types.GoogleSearch()),
    ]
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=4096),
        tools=tools,
    )

    start = time.perf_counter()
    full_text = []
    for chunk in client.models.generate_content_stream(
        model="gemini-flash-lite-latest",
        contents=contents,
        config=generate_content_config,
    ):
        if chunk.text:
            print(chunk.text, end="")
            full_text.append(chunk.text)

    elapsed = time.perf_counter() - start
    timestamp = datetime.now().isoformat()
    print(f"\n[{timestamp}] elapsed: {elapsed:.3f}s")

    return "".join(full_text)


def _extract_json(text: str) -> dict:
    text = (text or "").strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError(f"Model did not return JSON.\nRaw output:\n{text}")

    candidate = text[start : end + 1]
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        raise ValueError(
            f"Could not parse JSON.\nCandidate:\n{candidate}\n\nRaw output:\n{text}"
        )


def _parse_list_items_as_topic_score(items: list) -> dict[str, int]:
    """
    Accept list like ["arrays 10", "two pointers 7"] and return {"arrays":10, "two pointers":7}
    """
    out: dict[str, int] = {}
    for it in items:
        s = str(it).strip()
        if not s:
            continue
        parts = s.split()
        if len(parts) >= 2 and parts[-1].isdigit():
            topic = " ".join(parts[:-1]).strip()
            score = int(parts[-1])
            if topic:
                out[topic] = score
        else:
            # If no score, default to 1
            out[s] = 1
    return out


def _coerce_topic_score_map(value) -> dict[str, int]:
    """
    Accept either:
      - dict: {"arrays": 10, ...}
      - list: ["arrays 10", ...]
    Return dict[str,int]
    """
    if isinstance(value, dict):
        out: dict[str, int] = {}
        for k, v in value.items():
            key = str(k).strip()
            if not key:
                continue
            num = int(v) if isinstance(v, (int, float)) and float(v).is_integer() else None
            if num is None:
                # last resort: parse numeric from string
                try:
                    num = int(str(v).strip())
                except Exception:
                    num = 1
            out[key] = num
        return out

    if isinstance(value, list):
        return _parse_list_items_as_topic_score(value)

    raise ValueError(f"Expected dict or list, got {type(value).__name__}")


def generate_concepts_from_prompt(company_name: str, job_role: str, job_link: str) -> dict:
    """
    Reads prompt.md, replaces placeholders, calls generate(),
    parses JSON that contains either:
      - dsa_topics: {topic: score, ...}  OR  ["topic score", ...]
      - core_fundamentals: {topic: score, ...}  OR  ["topic score", ...]
    Returns:
      { "dsaConcepts": {topic: score}, "coreConcepts": {topic: score} }
    """
    here = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(here, "prompt.md")

    with open(prompt_path, "r", encoding="utf-8") as f:
        job_description_text = f.read()

    job_description_text = job_description_text.replace("{{company_name}}", company_name)
    job_description_text = job_description_text.replace("{{job_role}}", job_role)
    job_description_text = job_description_text.replace("{{job_link}}", job_link)
    job_description_text = job_description_text.replace("{{dsa_topics}}", dsa_topics)
    job_description_text = job_description_text.replace("{{core_fundamentals}}", core_fundamentals)
    job_description_text = job_description_text.replace("{{total_prep_days}}", total_prep_days)
    job_description_text = job_description_text.replace("{{daily_hours}}", daily_hours)
    generate(job_description=job_description_text)

    out = generate(job_description=job_description_text)
    data = _extract_json(out)

    if "dsa_topics" not in data or "core_fundamentals" not in data:
        raise ValueError(
            "Invalid JSON shape. Expected keys: dsa_topics, core_fundamentals.\n"
            f"Raw output:\n{out}"
        )

    dsa_map = _coerce_topic_score_map(data.get("dsa_topics"))
    core_map = _coerce_topic_score_map(data.get("core_fundamentals"))
    # Keep insertion order as returned by model
    dsa_map = dict(list(dsa_map.items())[:10])
    core_map = dict(list(core_map.items())[:10])

    if not dsa_map or not core_map:
        raise ValueError(f"Backend returned empty concepts.\nRaw output:\n{out}")

    return {"dsaConcepts": dsa_map, "coreConcepts": core_map}


if __name__ == "__main__":
    print("--- Generate ---")
    company_name = "Qualcomm"
    job_role = "Software Engineering Intern"
    job_link = "https://www.qualcomm.com/careers/students/internships"
    print("\n--- Parsed Concepts ---")
    print(generate_concepts_from_prompt(company_name, job_role, job_link))