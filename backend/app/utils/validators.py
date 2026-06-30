from __future__ import annotations
"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ─── Enums ───

class Proficiency(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class RiskLevel(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class PotentialLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXCEPTIONAL = "exceptional"


# ─── JD Schemas ───

class SkillRequirement(BaseModel):
    skill: str
    proficiency: Proficiency = Proficiency.INTERMEDIATE
    criticality: float = Field(ge=0, le=1, default=0.5)
    category: str = "technical"


class ExperienceRequirement(BaseModel):
    min_years: int = 0
    preferred_years: int = 0
    domains: list[str] = []


class JDAnalysisRequest(BaseModel):
    title: str = ""
    description: str
    company: str = ""
    level: str = ""


class JDAnalysisResponse(BaseModel):
    jd_id: str
    title: str
    technical_skills: list[SkillRequirement]
    soft_skills: list[SkillRequirement]
    experience: ExperienceRequirement
    hidden_requirements: list[str]
    culture_signals: list[str]
    domains: list[str]
    raw_description: str


# ─── Candidate Schemas ───

class WorkHistory(BaseModel):
    company: str
    role: str
    years: float
    achievements: str = ""


class CandidateProfile(BaseModel):
    id: str = ""
    name: str
    title: str = ""
    experience_years: float = 0
    skills: list[str] = []
    work_history: list[WorkHistory] = []
    education: str = ""
    certifications: list[str] = []
    github: str = ""
    linkedin_headline: str = ""
    summary: str = ""
    location: str = ""


class CandidateUploadRequest(BaseModel):
    candidates: list[CandidateProfile]


class CandidateUploadResponse(BaseModel):
    total: int
    valid: int
    errors: int
    error_details: list[str] = []
    candidate_ids: list[str]


# ─── Scoring Schemas ───

class DimensionScore(BaseModel):
    name: str
    score: float = Field(ge=0, le=100)
    weight: float
    weighted_score: float
    explanation: str


class SkillMatch(BaseModel):
    skill: str
    status: str  # "match", "partial", "missing"
    candidate_skill: str = ""
    transfer_score: float = 0.0
    explanation: str = ""


class StrengthItem(BaseModel):
    text: str
    evidence: str = ""


class DevelopmentArea(BaseModel):
    text: str
    suggestion: str = ""


class CandidateExplanation(BaseModel):
    executive_summary: str
    strengths: list[StrengthItem]
    development_areas: list[DevelopmentArea]
    why_this_ranking: str
    risk_assessment: RiskLevel
    risk_details: list[str] = []
    long_term_potential: PotentialLevel
    potential_explanation: str = ""


class CandidateResult(BaseModel):
    candidate_id: str
    name: str
    title: str
    rank: int
    total_score: float
    dimensions: list[DimensionScore]
    skill_matches: list[SkillMatch]
    explanation: CandidateExplanation
    experience_years: float
    skills: list[str]
    education: str = ""
    certifications: list[str] = []
    work_history: list[WorkHistory] = []


# ─── Analysis Schemas ───

class AnalysisRequest(BaseModel):
    jd_id: str


class AnalysisSummary(BaseModel):
    total_candidates: int
    processing_time_seconds: float
    top_match_score: float
    avg_score: float
    recommended_shortlist_count: int
    shortlist_threshold: float = 80.0


class AnalysisResponse(BaseModel):
    analysis_id: str
    jd_id: str
    summary: AnalysisSummary
    ranked_candidates: list[CandidateResult]


# ─── Comparison Schemas ───

class ComparisonRequest(BaseModel):
    candidate_ids: list[str] = Field(min_length=2, max_length=3)


class ComparisonDelta(BaseModel):
    dimension: str
    candidate_a_score: float
    candidate_b_score: float
    advantage: str  # candidate_a or candidate_b
    delta: float


class ComparisonResponse(BaseModel):
    candidates: list[CandidateResult]
    deltas: list[ComparisonDelta] = []
    recommendation: str
