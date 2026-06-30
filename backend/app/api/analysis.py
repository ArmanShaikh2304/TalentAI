from __future__ import annotations
"""
Analysis API Endpoints — Run ranking analysis and get results.
"""
import time
import uuid
from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_current_user
from app.utils.validators import (
    AnalysisRequest, AnalysisResponse, AnalysisSummary,
    CandidateResult, ComparisonRequest, ComparisonResponse, ComparisonDelta,
)
from app.api.jd import get_jd_from_store
from app.api.candidates import get_all_candidates, get_candidate_by_id
from app.ai.candidate_analyzer import compute_semantic_similarity
from app.ai.scoring import compute_all_scores
from app.ai.explainer import generate_explanation

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])

# In-memory store for analysis results
_analysis_store: dict[str, AnalysisResponse] = {}


@router.post("/run", response_model=AnalysisResponse)
async def run_analysis(request: AnalysisRequest, _user: dict = Depends(get_current_user)):
    """
    Run full candidate ranking analysis against a job description.
    This is the main endpoint that orchestrates the entire AI pipeline.
    """
    start_time = time.time()

    # 1. Get the analyzed JD
    jd = get_jd_from_store(request.jd_id)
    if not jd:
        raise HTTPException(status_code=404, detail=f"JD '{request.jd_id}' not found. Analyze a JD first.")

    # 2. Get all candidates
    candidates = get_all_candidates()
    if not candidates:
        raise HTTPException(status_code=400, detail="No candidates uploaded. Upload candidates first.")

    # 3. Compute semantic similarity scores
    semantic_scores = compute_semantic_similarity(jd, candidates)

    # 4. Score each candidate across all 7 dimensions
    candidate_results: list[CandidateResult] = []

    for i, candidate in enumerate(candidates):
        semantic_score = semantic_scores[i]

        # Compute all dimension scores
        total_score, dimensions, skill_matches = compute_all_scores(
            candidate, jd, semantic_score,
        )

        candidate_results.append({
            "candidate": candidate,
            "total_score": total_score,
            "dimensions": dimensions,
            "skill_matches": skill_matches,
            "semantic_score": semantic_score,
        })

    # 5. Sort by total score (descending)
    candidate_results.sort(key=lambda x: x["total_score"], reverse=True)

    # 6. Generate explanations and build final results
    ranked_results: list[CandidateResult] = []
    for rank_idx, result in enumerate(candidate_results):
        candidate = result["candidate"]
        rank = rank_idx + 1

        explanation = generate_explanation(
            candidate=candidate,
            jd=jd,
            total_score=result["total_score"],
            dimensions=result["dimensions"],
            skill_matches=result["skill_matches"],
            rank=rank,
        )

        ranked_results.append(CandidateResult(
            candidate_id=candidate.id,
            name=candidate.name,
            title=candidate.title,
            rank=rank,
            total_score=result["total_score"],
            dimensions=result["dimensions"],
            skill_matches=result["skill_matches"],
            explanation=explanation,
            experience_years=candidate.experience_years,
            skills=candidate.skills,
            education=candidate.education,
            certifications=candidate.certifications,
            work_history=candidate.work_history,
        ))

    # 7. Build summary
    processing_time = round(time.time() - start_time, 2)
    scores = [r.total_score for r in ranked_results]

    shortlist_threshold = 80.0
    shortlisted = [r for r in ranked_results if r.total_score >= shortlist_threshold]

    summary = AnalysisSummary(
        total_candidates=len(ranked_results),
        processing_time_seconds=processing_time,
        top_match_score=max(scores) if scores else 0,
        avg_score=round(sum(scores) / len(scores), 1) if scores else 0,
        recommended_shortlist_count=len(shortlisted),
        shortlist_threshold=shortlist_threshold,
    )

    analysis_id = str(uuid.uuid4())[:8]
    response = AnalysisResponse(
        analysis_id=analysis_id,
        jd_id=request.jd_id,
        summary=summary,
        ranked_candidates=ranked_results,
    )

    _analysis_store[analysis_id] = response
    return response


@router.get("/{analysis_id}/results", response_model=AnalysisResponse)
async def get_results(analysis_id: str, _user: dict = Depends(get_current_user)):
    """Get analysis results by ID."""
    if analysis_id not in _analysis_store:
        raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found")
    return _analysis_store[analysis_id]


@router.post("/{analysis_id}/compare", response_model=ComparisonResponse)
async def compare_candidates(analysis_id: str, request: ComparisonRequest, _user: dict = Depends(get_current_user)):
    """Compare 2-3 candidates side-by-side."""
    if analysis_id not in _analysis_store:
        raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found")

    analysis = _analysis_store[analysis_id]

    # Find requested candidates in results
    selected: list[CandidateResult] = []
    for cid in request.candidate_ids:
        found = next((r for r in analysis.ranked_candidates if r.candidate_id == cid), None)
        if not found:
            raise HTTPException(status_code=404, detail=f"Candidate '{cid}' not found in analysis")
        selected.append(found)

    # Compute deltas between first two candidates
    deltas: list[ComparisonDelta] = []
    if len(selected) >= 2:
        a, b = selected[0], selected[1]
        for dim_a in a.dimensions:
            dim_b = next((d for d in b.dimensions if d.name == dim_a.name), None)
            if dim_b:
                delta = abs(dim_a.score - dim_b.score)
                advantage = a.name if dim_a.score >= dim_b.score else b.name
                deltas.append(ComparisonDelta(
                    dimension=dim_a.name,
                    candidate_a_score=dim_a.score,
                    candidate_b_score=dim_b.score,
                    advantage=advantage,
                    delta=round(delta, 1),
                ))

    # Generate recommendation
    if selected:
        best = max(selected, key=lambda c: c.total_score)
        second = sorted(selected, key=lambda c: c.total_score, reverse=True)
        if len(second) >= 2:
            diff = best.total_score - second[1].total_score
            if diff < 3:
                recommendation = (
                    f"{best.name} and {second[1].name} are very close in overall fit. "
                    f"Choose {best.name} for immediate impact, or {second[1].name} "
                    f"if their unique strengths better align with team needs."
                )
            else:
                recommendation = (
                    f"{best.name} leads with {best.total_score:.0f}% vs {second[1].total_score:.0f}%. "
                    f"The {diff:.0f}% gap is primarily in "
                    + (deltas[0].dimension if deltas else "overall fit") + "."
                )
        else:
            recommendation = f"{best.name} scores {best.total_score:.0f}% — strong candidate."
    else:
        recommendation = "No candidates to compare."

    return ComparisonResponse(
        candidates=selected,
        deltas=deltas,
        recommendation=recommendation,
    )


@router.get("/", response_model=list[dict])
async def list_analyses(_user: dict = Depends(get_current_user)):
    """List all analyses (summary only)."""
    return [
        {
            "analysis_id": aid,
            "jd_id": analysis.jd_id,
            "total_candidates": analysis.summary.total_candidates,
            "top_score": analysis.summary.top_match_score,
            "processing_time": analysis.summary.processing_time_seconds,
        }
        for aid, analysis in _analysis_store.items()
    ]


@router.get("/{analysis_id}/stats")
async def get_analysis_stats(analysis_id: str, _user: dict = Depends(get_current_user)):
    """
    Get dashboard statistics for a given analysis.
    Returns counts for total, analyzed, shortlisted, rejected, pending, and average match %.
    """
    if analysis_id not in _analysis_store:
        raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found")

    analysis = _analysis_store[analysis_id]
    candidates = analysis.ranked_candidates
    threshold = analysis.summary.shortlist_threshold

    shortlisted = [c for c in candidates if c.total_score >= threshold]
    rejected = [c for c in candidates if c.total_score < 50.0]
    pending = [c for c in candidates if 50.0 <= c.total_score < threshold]

    scores = [c.total_score for c in candidates]
    avg_match = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        "total_candidates": len(candidates),
        "analyzed": len(candidates),
        "shortlisted": len(shortlisted),
        "rejected": len(rejected),
        "pending": len(pending),
        "avg_match_percent": avg_match,
        "shortlist_threshold": threshold,
    }
