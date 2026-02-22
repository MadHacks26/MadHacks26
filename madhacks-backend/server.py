from typing import Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from llm import generate_concepts_from_prompt, generate_roadmap_from_profile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConceptsRequest(BaseModel):
    role: str = Field(..., min_length=1)
    company: str = Field(..., min_length=1)
    jobLink: Optional[str] = ""


class ConceptsResponse(BaseModel):
    dsaConcepts: Dict[str, float]
    coreConcepts: Dict[str, float]


class TopicMeta(BaseModel):
    importance: float
    confidence: float


class ConceptProfile(BaseModel):
    dsa_topics: Dict[str, TopicMeta]
    core_fundamentals: Dict[str, TopicMeta]


class RoadmapRequest(BaseModel):
    role: str = Field(..., min_length=1)
    company: str = Field(..., min_length=1)
    jobLink: Optional[str] = ""
    prepDays: int = Field(..., ge=1, le=365)
    hoursPerDay: float = Field(..., gt=0, le=23)
    conceptProfile: ConceptProfile


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/concepts", response_model=ConceptsResponse)
def concepts(req: ConceptsRequest):
    try:
        result = generate_concepts_from_prompt(
            company_name=req.company.strip(),
            job_role=req.role.strip(),
            job_link=(req.jobLink or "").strip(),
        )

        if (
            not isinstance(result, dict)
            or not isinstance(result.get("dsaConcepts"), dict)
            or not isinstance(result.get("coreConcepts"), dict)
        ):
            raise ValueError(
                "llm.py returned invalid shape. Expected {dsaConcepts: {...}, coreConcepts: {...}}"
            )

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/roadmap")
def roadmap(req: RoadmapRequest):
    try:
        dsa_topics = {
            k: {"importance": float(v.importance), "confidence": float(v.confidence)}
            for k, v in req.conceptProfile.dsa_topics.items()
        }
        core_fundamentals = {
            k: {"importance": float(v.importance), "confidence": float(v.confidence)}
            for k, v in req.conceptProfile.core_fundamentals.items()
        }

        result = generate_roadmap_from_profile(
            company_name=req.company.strip(),
            job_role=req.role.strip(),
            job_link=(req.jobLink or "").strip(),
            total_prep_days=int(req.prepDays),
            daily_hours=float(req.hoursPerDay),
            dsa_topics=dsa_topics,
            core_fundamentals=core_fundamentals,
        )

        if not isinstance(result, dict):
            raise ValueError("Roadmap output must be a JSON object")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))