from __future__ import annotations
"""
JD API Endpoints — Job Description analysis and management.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_current_user
from app.utils.validators import JDAnalysisRequest, JDAnalysisResponse
from app.ai.jd_extractor import analyze_job_description

router = APIRouter(prefix="/api/jd", tags=["Job Descriptions"])

# In-memory store for analyzed JDs (in production, use database)
_jd_store: dict[str, JDAnalysisResponse] = {}


@router.post("/analyze", response_model=JDAnalysisResponse)
async def analyze_jd(request: JDAnalysisRequest, _user: dict = Depends(get_current_user)):
    """Analyze a job description and extract structured requirements."""
    if not request.description or len(request.description.strip()) < 20:
        raise HTTPException(status_code=400, detail="Job description must be at least 20 characters")

    result = analyze_job_description(request)
    _jd_store[result.jd_id] = result
    return result


@router.get("/{jd_id}", response_model=JDAnalysisResponse)
async def get_jd(jd_id: str, _user: dict = Depends(get_current_user)):
    """Retrieve an analyzed job description by ID."""
    if jd_id not in _jd_store:
        raise HTTPException(status_code=404, detail=f"JD '{jd_id}' not found")
    return _jd_store[jd_id]


@router.get("/", response_model=list[JDAnalysisResponse])
async def list_jds(_user: dict = Depends(get_current_user)):
    """List all analyzed job descriptions."""
    return list(_jd_store.values())


def get_jd_from_store(jd_id: str) -> JDAnalysisResponse | None:
    """Internal helper to access JD store from other modules."""
    return _jd_store.get(jd_id)
