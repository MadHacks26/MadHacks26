from typing import Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from llm import generate_concepts_from_prompt

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
            raise ValueError("llm.py returned invalid shape. Expected {dsaConcepts: {...}, coreConcepts: {...}}")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))