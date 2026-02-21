import os
import time
from datetime import datetime

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# Prompt = f"From the following job descrition provide 5 steps to prepare me for the role by providing the topics and resources to cover. Job Description: "

def generate(job_description: str = "Software Engineer 1", api_key: str | None = None):
    """Generate content using the streaming API with Google Search and types."""
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        raise ValueError(
            "Provide api_key or set GEMINI_API_KEY environment variable"
        )

    client = genai.Client(api_key=key)

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=job_description),
            ],
        ),
    ]
    tools = [
       types.Tool(url_context=types.UrlContext()),
        types.Tool(googleSearch=types.GoogleSearch()),
    ]
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_budget=4096,
        ),
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


def chat_example(api_key: str | None = None):
    """Multi-turn chat example."""
    key = api_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        raise ValueError(
            "Provide api_key or set GEMINI_API_KEY environment variable"
        )

    client = genai.Client(api_key=key)
    chat = client.chats.create(model="gemini-2.0-flash")

    start1 = time.perf_counter()
    msg1 = chat.send_message("What's 2 + 2?")
    elapsed1 = time.perf_counter() - start1
    timestamp1 = datetime.now().isoformat()
    print("User: What's 2 + 2?")
    print(f"Gemini: {msg1.text}")
    print(f"[{timestamp1}] elapsed: {elapsed1:.3f}s\n")

    start2 = time.perf_counter()
    msg2 = chat.send_message("Now double that.")
    elapsed2 = time.perf_counter() - start2
    timestamp2 = datetime.now().isoformat()
    print("User: Now double that.")
    print(f"Gemini: {msg2.text}")
    print(f"[{timestamp2}] elapsed: {elapsed2:.3f}s")

    return msg2.text


def generate_roadmap(job_description: str = "Software Engineer 1", api_key: str | None = None):
    """Generate roadmap using the streaming API with Google Search and types."""
    print("--- Generate --- roadmapq")
    company_name = "Qualcomm"
    job_role = "Software Engineering Intern"
    job_link = "https://www.qualcomm.com/careers/students/internships"
    total_prep_days = 30
    daily_hours = 2

    dsa_topics = {"arrays" : {"importance": 7, "confidence": 3}, "linked lists": {"importance": 3, "confidence": 8}, "stacks": {"importance": 5, "confidence": 2}, "queues": {"importance": 4, "confidence": 7}, "trees": {"importance": 2, "confidence": 3}, "graphs": {"importance": 3, "confidence": 8}, "sorting": {"importance": 2, "confidence": 3}, "searching": {"importance": 1, "confidence": 2}, "hashing": {"importance": 1, "confidence": 2}, "dynamic programming": {"importance": 1, "confidence": 2}, "backtracking": {"importance": 1, "confidence": 2}, "greedy": {"importance": 1, "confidence": 2}, "divide and conquer": {"importance": 1, "confidence": 2}}
    core_fundamentals = {"OS": {"importance": 7, "confidence": 3}, "DBMS": {"importance": 3, "confidence": 8}, "HLD": {"importance": 5, "confidence": 2}, "LLD": {"importance": 4, "confidence": 7}, "Networking": {"importance": 2, "confidence": 3}, "Concurrency and Multithreading": {"importance": 3, "confidence": 8}, "Distributed Systems": {"importance": 2, "confidence": 3}}
    
    with open("roadmap.md", "r", encoding="utf-8") as f:
        job_description_text = f.read()
    # print(job_description_text)
    job_description_text = job_description_text.replace("{{company_name}}", company_name)
    job_description_text = job_description_text.replace("{{job_role}}", job_role)
    job_description_text = job_description_text.replace("{{job_link}}", job_link)
    job_description_text = job_description_text.replace("{{dsa_topics}}", dsa_topics)
    job_description_text = job_description_text.replace("{{core_fundamentals}}", core_fundamentals)
    job_description_text = job_description_text.replace("{{total_prep_days}}", total_prep_days)
    job_description_text = job_description_text.replace("{{daily_hours}}", daily_hours)
    generate(job_description=job_description_text)

def generate_concepts(job_description: str = "Software Engineer 1", api_key: str | None = None):
    print("--- Generate --- concepts")
    company_name = "Qualcomm"
    job_role = "Software Engineering Intern"
    job_link = "https://www.qualcomm.com/careers/students/internships"
    # Read the contents of the file named 'job_description'
    with open("prompt.md", "r", encoding="utf-8") as f:
        job_description_text = f.read()
    # print(job_description_text)
    job_description_text = job_description_text.replace("{{company_name}}", company_name)
    job_description_text = job_description_text.replace("{{job_role}}", job_role)
    job_description_text = job_description_text.replace("{{job_link}}", job_link)
    generate(job_description=job_description_text)
