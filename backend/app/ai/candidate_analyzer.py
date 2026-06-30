from __future__ import annotations
"""
Candidate Analyzer — Generates embeddings and performs semantic matching.
Uses sentence-transformers for embeddings and sklearn cosine similarity.
Falls back to TF-IDF if sentence-transformers isn't available.
"""
import numpy as np
from typing import Optional
from app.utils.validators import CandidateProfile, JDAnalysisResponse


# ─── Embedding Model (lazy loaded) ───
_model = None
_use_tfidf = False


def _get_model():
    """Lazy load the sentence-transformer model, fallback to TF-IDF."""
    global _model, _use_tfidf
    if _model is not None:
        return _model

    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        _use_tfidf = False
        print("✅ Loaded sentence-transformers model: all-MiniLM-L6-v2")
    except Exception as e:
        print(f"⚠️ sentence-transformers not available ({e}), using TF-IDF fallback")
        from sklearn.feature_extraction.text import TfidfVectorizer
        _model = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            stop_words='english',
        )
        _use_tfidf = True

    return _model


def _build_candidate_text(candidate: CandidateProfile) -> str:
    """Build a comprehensive text representation of a candidate for embedding."""
    parts = []

    if candidate.title:
        parts.append(f"Job Title: {candidate.title}")
    if candidate.summary:
        parts.append(f"Summary: {candidate.summary}")
    if candidate.skills:
        parts.append(f"Skills: {', '.join(candidate.skills)}")
    if candidate.experience_years:
        parts.append(f"Experience: {candidate.experience_years} years")
    if candidate.education:
        parts.append(f"Education: {candidate.education}")
    if candidate.certifications:
        parts.append(f"Certifications: {', '.join(candidate.certifications)}")
    if candidate.linkedin_headline:
        parts.append(f"Profile: {candidate.linkedin_headline}")

    for job in candidate.work_history:
        job_text = f"Worked as {job.role} at {job.company} for {job.years} years"
        if job.achievements:
            job_text += f". Achievements: {job.achievements}"
        parts.append(job_text)

    return ". ".join(parts)


def _build_jd_text(jd: JDAnalysisResponse) -> str:
    """Build a comprehensive text representation of a JD for embedding."""
    parts = [f"Job Title: {jd.title}"]

    tech_skills = [s.skill for s in jd.technical_skills]
    if tech_skills:
        parts.append(f"Required Technical Skills: {', '.join(tech_skills)}")

    soft_skills = [s.skill for s in jd.soft_skills]
    if soft_skills:
        parts.append(f"Required Soft Skills: {', '.join(soft_skills)}")

    if jd.experience.min_years:
        parts.append(f"Experience Required: {jd.experience.min_years}+ years")

    if jd.domains:
        parts.append(f"Domain: {', '.join(jd.domains)}")

    if jd.hidden_requirements:
        parts.append(f"Additional Requirements: {', '.join(jd.hidden_requirements)}")

    if jd.culture_signals:
        parts.append(f"Culture: {', '.join(jd.culture_signals)}")

    parts.append(jd.raw_description[:500])

    return ". ".join(parts)


def generate_embeddings(texts: list[str]) -> np.ndarray:
    """Generate embeddings for a list of texts."""
    model = _get_model()

    if _use_tfidf:
        # TF-IDF approach
        return model.fit_transform(texts).toarray()
    else:
        # Sentence transformer approach
        return model.encode(texts, show_progress_bar=False, normalize_embeddings=True)


def compute_semantic_similarity(jd: JDAnalysisResponse, candidates: list[CandidateProfile]) -> list[float]:
    """
    Compute semantic similarity between a JD and a list of candidates.
    Returns list of similarity scores (0-100).
    """
    jd_text = _build_jd_text(jd)
    candidate_texts = [_build_candidate_text(c) for c in candidates]

    all_texts = [jd_text] + candidate_texts

    model = _get_model()

    if _use_tfidf:
        from sklearn.metrics.pairwise import cosine_similarity
        tfidf_matrix = model.fit_transform(all_texts)
        jd_vec = tfidf_matrix[0:1]
        cand_vecs = tfidf_matrix[1:]
        similarities = cosine_similarity(jd_vec, cand_vecs)[0]
    else:
        embeddings = model.encode(all_texts, show_progress_bar=False, normalize_embeddings=True)
        jd_embedding = embeddings[0].reshape(1, -1)
        candidate_embeddings = embeddings[1:]
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(jd_embedding, candidate_embeddings)[0]

    # Convert to 0-100 scale and ensure non-negative
    scores = [max(0, min(100, float(s) * 100)) for s in similarities]
    return scores
