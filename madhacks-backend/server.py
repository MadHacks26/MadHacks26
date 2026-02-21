from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from llm import generate_concepts_from_prompt

app = FastAPI()

class ConceptsRequest(BaseModel):
    role: str
    company: str
    jobLink: str 

@app.get("/api/health")
def health():
    return {"ok": True}

@app.post("/api/concepts")
def concepts(req: ConceptsRequest):
    try:
        return generate_concepts_from_prompt(
            company_name=req.company.strip(),
            job_role=req.role.strip(),
            job_link=req.jobLink.strip(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))