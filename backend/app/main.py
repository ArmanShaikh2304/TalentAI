from __future__ import annotations
"""
FastAPI Application Entry Point — AI-Powered Candidate Ranking System.
"""
from dotenv import load_dotenv
load_dotenv()  # Load .env before any module reads os.getenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import jd, candidates, analysis, export, auth

app = FastAPI(
    title="AI Candidate Ranking System",
    description="Intelligent AI-powered recruiter that ranks candidates with explainable reasoning",
    version="1.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router)
app.include_router(jd.router)
app.include_router(candidates.router)
app.include_router(analysis.router)
app.include_router(export.router)


@app.get("/")
async def root():
    return {
        "name": "AI Candidate Ranking System",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "jd_analysis": "/api/jd/analyze",
            "candidates": "/api/candidates/upload",
            "analysis": "/api/analysis/run",
            "export": "/api/export/csv/{analysis_id}",
            "docs": "/docs",
        },
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
