from __future__ import annotations
"""
Candidates API Endpoints — Upload and manage candidate profiles.
"""
import uuid
import json
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.api.dependencies import get_current_user
from app.utils.validators import (
    CandidateProfile, CandidateUploadRequest, CandidateUploadResponse, WorkHistory,
)

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

# In-memory store for candidates
_candidate_store: dict[str, CandidateProfile] = {}


@router.post("/upload", response_model=CandidateUploadResponse)
async def upload_candidates(request: CandidateUploadRequest, _user: dict = Depends(get_current_user)):
    """Upload candidate profiles as JSON."""
    valid = 0
    errors = 0
    error_details = []
    candidate_ids = []

    for i, candidate in enumerate(request.candidates):
        try:
            if not candidate.name:
                raise ValueError("Candidate name is required")

            # Assign ID if not provided
            if not candidate.id:
                candidate.id = f"cand_{uuid.uuid4().hex[:6]}"

            _candidate_store[candidate.id] = candidate
            candidate_ids.append(candidate.id)
            valid += 1
        except Exception as e:
            errors += 1
            error_details.append(f"Candidate #{i + 1}: {str(e)}")

    return CandidateUploadResponse(
        total=len(request.candidates),
        valid=valid,
        errors=errors,
        error_details=error_details,
        candidate_ids=candidate_ids,
    )


@router.post("/upload-file", response_model=CandidateUploadResponse)
async def upload_candidates_file(file: UploadFile = File(...), _user: dict = Depends(get_current_user)):
    """Upload candidates from a JSON or CSV file."""
    content = await file.read()
    text = content.decode("utf-8")

    candidates = []

    if file.filename and file.filename.endswith(".csv"):
        # Parse CSV
        reader = csv.DictReader(io.StringIO(text))
        for row in reader:
            try:
                # Parse skills from comma-separated string
                skills = [s.strip() for s in row.get("skills", "").split(",")] if row.get("skills") else []
                certs = [s.strip() for s in row.get("certifications", "").split(",")] if row.get("certifications") else []

                candidate = CandidateProfile(
                    id=row.get("id", f"cand_{uuid.uuid4().hex[:6]}"),
                    name=row.get("name", ""),
                    title=row.get("title", ""),
                    experience_years=float(row.get("experience_years", 0)),
                    skills=skills,
                    education=row.get("education", ""),
                    certifications=certs,
                    github=row.get("github", ""),
                    linkedin_headline=row.get("linkedin_headline", ""),
                    summary=row.get("summary", ""),
                    location=row.get("location", ""),
                )
                candidates.append(candidate)
            except Exception as e:
                pass
    else:
        # Parse JSON
        try:
            data = json.loads(text)
            if isinstance(data, list):
                for item in data:
                    candidates.append(CandidateProfile(**item))
            elif isinstance(data, dict) and "candidates" in data:
                for item in data["candidates"]:
                    candidates.append(CandidateProfile(**item))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Process using the existing upload logic
    request = CandidateUploadRequest(candidates=candidates)
    return await upload_candidates(request)


@router.get("/", response_model=list[CandidateProfile])
async def list_candidates(_user: dict = Depends(get_current_user)):
    """List all uploaded candidates."""
    return list(_candidate_store.values())


@router.get("/{candidate_id}", response_model=CandidateProfile)
async def get_candidate(candidate_id: str, _user: dict = Depends(get_current_user)):
    """Get a single candidate by ID."""
    if candidate_id not in _candidate_store:
        raise HTTPException(status_code=404, detail=f"Candidate '{candidate_id}' not found")
    return _candidate_store[candidate_id]


@router.delete("/")
async def clear_candidates(_user: dict = Depends(get_current_user)):
    """Clear all candidates."""
    _candidate_store.clear()
    return {"message": "All candidates cleared"}


def get_all_candidates() -> list[CandidateProfile]:
    """Internal helper to get all candidates."""
    return list(_candidate_store.values())


def get_candidate_by_id(candidate_id: str) -> CandidateProfile | None:
    """Internal helper to get a candidate by ID."""
    return _candidate_store.get(candidate_id)
