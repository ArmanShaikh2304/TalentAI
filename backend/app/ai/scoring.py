from __future__ import annotations
"""
7-Dimension Scoring Engine — The heart of the AI recruiter.
Computes a multi-dimensional score for each candidate against a job description.
"""
import re
from app.utils.constants import (
    SCORING_WEIGHTS, SKILL_TRANSFER_MATRIX,
    LEADERSHIP_BONUS, LEARNING_VELOCITY_BONUS, QUICK_RAMPUP_BONUS,
    JOB_HOPPING_THRESHOLD_MONTHS, STAGNATION_YEARS,
)
from app.utils.validators import (
    CandidateProfile, JDAnalysisResponse,
    DimensionScore, SkillMatch,
)


def _normalize_skill(skill: str) -> str:
    """Normalize a skill name for comparison."""
    return skill.lower().strip().replace('-', ' ').replace('_', ' ')


def compute_technical_skills_score(
    candidate: CandidateProfile,
    jd: JDAnalysisResponse,
) -> tuple[float, list[SkillMatch]]:
    """
    Score technical skill match (0-100).
    Considers exact matches, transferable skills, and missing skills.
    Returns (score, skill_matches).
    """
    jd_skills = jd.technical_skills
    if not jd_skills:
        return 80.0, []

    candidate_skills_norm = {_normalize_skill(s) for s in candidate.skills}
    skill_matches: list[SkillMatch] = []
    total_weighted_score = 0.0
    total_weight = 0.0

    for req in jd_skills:
        req_norm = _normalize_skill(req.skill)
        weight = req.criticality
        total_weight += weight

        # 1. Exact match
        if req_norm in candidate_skills_norm:
            total_weighted_score += weight * 100
            skill_matches.append(SkillMatch(
                skill=req.skill,
                status="match",
                candidate_skill=req.skill,
                transfer_score=1.0,
                explanation=f"Candidate has {req.skill} — direct match",
            ))
            continue

        # 2. Check for transferable skills
        best_transfer = 0.0
        best_match = ""
        transfer_map = SKILL_TRANSFER_MATRIX.get(req_norm, [])

        for related_skill, transfer_pct in transfer_map:
            related_norm = _normalize_skill(related_skill)
            if related_norm in candidate_skills_norm:
                if transfer_pct > best_transfer:
                    best_transfer = transfer_pct
                    best_match = related_skill

        # Also check reverse: does any candidate skill transfer to this requirement?
        if best_transfer == 0:
            for cand_skill in candidate_skills_norm:
                transfers = SKILL_TRANSFER_MATRIX.get(cand_skill, [])
                for related, pct in transfers:
                    if _normalize_skill(related) == req_norm and pct > best_transfer:
                        best_transfer = pct
                        best_match = cand_skill

        if best_transfer > 0:
            total_weighted_score += weight * best_transfer * 100
            skill_matches.append(SkillMatch(
                skill=req.skill,
                status="partial",
                candidate_skill=best_match,
                transfer_score=best_transfer,
                explanation=f"Candidate has {best_match} ({int(best_transfer*100)}% transferable to {req.skill})",
            ))
        else:
            # 3. Missing skill
            skill_matches.append(SkillMatch(
                skill=req.skill,
                status="missing",
                candidate_skill="",
                transfer_score=0.0,
                explanation=f"Candidate lacks {req.skill} — no transferable skills found",
            ))

    score = (total_weighted_score / total_weight) if total_weight > 0 else 50.0
    return round(min(100, score), 1), skill_matches


def compute_experience_score(
    candidate: CandidateProfile,
    jd: JDAnalysisResponse,
) -> float:
    """
    Score experience level match (0-100).
    Considers years of experience vs. JD requirements.
    """
    min_years = jd.experience.min_years
    preferred_years = jd.experience.preferred_years
    candidate_years = candidate.experience_years

    if min_years == 0 and preferred_years == 0:
        # No experience requirement specified
        return 75.0

    if candidate_years >= preferred_years:
        # Meets or exceeds preferred — excellent
        score = 95.0
        # Small bonus for exceeding, but cap (overqualified can be a concern)
        excess = candidate_years - preferred_years
        if excess <= 3:
            score += excess * 1.5
        else:
            score += 4.5 - (excess - 3) * 2  # Slight penalty for very overqualified
    elif candidate_years >= min_years:
        # Meets minimum — good
        range_span = max(preferred_years - min_years, 1)
        progress = (candidate_years - min_years) / range_span
        score = 70 + progress * 25
    elif candidate_years >= min_years * 0.75:
        # Close to minimum — acceptable
        score = 50 + (candidate_years / max(min_years, 1)) * 20
    else:
        # Significantly below minimum
        score = max(10, (candidate_years / max(min_years, 1)) * 50)

    return round(min(100, max(0, score)), 1)


def compute_career_trajectory_score(candidate: CandidateProfile) -> float:
    """
    Score career trajectory (0-100).
    Analyzes: progressive growth, role consistency, learning velocity.
    """
    work_history = candidate.work_history
    if not work_history or len(work_history) < 2:
        return 60.0  # Neutral if insufficient data

    score = 60.0  # Base score

    # 1. Check for progressive role growth
    seniority_keywords = {
        "intern": 0, "trainee": 0, "fresher": 0,
        "junior": 1, "associate": 1,
        "mid": 2,
        "senior": 3, "sr": 3,
        "lead": 4, "staff": 4, "principal": 5,
        "architect": 5, "manager": 4, "director": 6,
        "head": 6, "vp": 7, "cto": 8,
    }

    levels = []
    for job in work_history:
        role_lower = job.role.lower()
        level = 2  # Default mid-level
        for keyword, seniority in seniority_keywords.items():
            if keyword in role_lower:
                level = seniority
                break
        levels.append(level)

    # Check if trajectory is upward (most recent job first or last)
    # Assume work_history is ordered most recent first
    if len(levels) >= 2:
        upward_moves = sum(1 for i in range(len(levels) - 1) if levels[i] > levels[i + 1])
        lateral_moves = sum(1 for i in range(len(levels) - 1) if levels[i] == levels[i + 1])
        downward_moves = sum(1 for i in range(len(levels) - 1) if levels[i] < levels[i + 1])

        total_moves = len(levels) - 1
        if total_moves > 0:
            growth_ratio = upward_moves / total_moves
            score += growth_ratio * 25  # Up to +25 for consistent growth
            score -= downward_moves / total_moves * 15  # Penalty for downward moves

    # 2. Check average tenure (job hopping detection)
    tenures = [job.years for job in work_history if job.years > 0]
    if tenures:
        avg_tenure = sum(tenures) / len(tenures)
        if avg_tenure >= 3:
            score += 10  # Good stability
        elif avg_tenure >= 2:
            score += 5
        elif avg_tenure < 1:
            score -= 15  # Job hopping concern

    # 3. Check for achievements/impact in roles
    achievement_keywords = [
        "built", "led", "improved", "increased", "reduced", "launched",
        "designed", "architected", "mentored", "scaled", "optimized",
        "delivered", "managed", "created", "developed",
    ]
    achievement_count = 0
    for job in work_history:
        if job.achievements:
            for kw in achievement_keywords:
                if kw in job.achievements.lower():
                    achievement_count += 1
                    break

    score += min(10, achievement_count * 3)

    return round(min(100, max(0, score)), 1)


def compute_domain_knowledge_score(
    candidate: CandidateProfile,
    jd: JDAnalysisResponse,
) -> float:
    """Score domain/industry knowledge match (0-100)."""
    if not jd.domains:
        return 70.0  # No domain requirement

    candidate_text = " ".join([
        candidate.title or "",
        candidate.summary or "",
        candidate.linkedin_headline or "",
    ] + [f"{j.company} {j.role} {j.achievements}" for j in candidate.work_history]).lower()

    matched_domains = 0
    for domain in jd.domains:
        if domain.lower() in candidate_text:
            matched_domains += 1

    if not jd.domains:
        return 70.0

    match_ratio = matched_domains / len(jd.domains)
    return round(40 + match_ratio * 60, 1)


def compute_behavioral_signals_score(candidate: CandidateProfile) -> float:
    """
    Score behavioral signals (0-100).
    Considers: certifications, open source, side projects, etc.
    """
    score = 50.0  # Base

    # Certifications
    if candidate.certifications:
        score += min(20, len(candidate.certifications) * 7)

    # GitHub presence
    if candidate.github:
        score += 10

    # LinkedIn headline quality
    if candidate.linkedin_headline:
        if len(candidate.linkedin_headline) > 20:
            score += 5
        if any(w in candidate.linkedin_headline.lower() for w in
               ["contributor", "speaker", "author", "mentor", "leader", "open source"]):
            score += 10

    # Achievements that suggest behavioral traits
    behavioral_keywords = [
        "mentored", "led", "initiated", "volunteered", "open source",
        "published", "spoke", "presented", "organized", "community",
        "contributed", "award", "recognized",
    ]
    for job in candidate.work_history:
        if job.achievements:
            for kw in behavioral_keywords:
                if kw in job.achievements.lower():
                    score += 3
                    break

    return round(min(100, score), 1)


def compute_red_flags_score(candidate: CandidateProfile) -> float:
    """
    Compute red flags penalty (0-100, where 100 = many red flags).
    Lower is better (this gets subtracted from total).
    """
    penalty = 0.0

    # 1. Job hopping: average tenure < 1 year
    if candidate.work_history:
        tenures = [j.years for j in candidate.work_history if j.years > 0]
        if tenures:
            avg_tenure = sum(tenures) / len(tenures)
            if avg_tenure < 0.75:
                penalty += 40  # Severe job hopping
            elif avg_tenure < 1.0:
                penalty += 25
            elif avg_tenure < 1.5:
                penalty += 10

    # 2. Stagnation: same level for too long
    if candidate.work_history:
        same_role_years = 0
        for job in candidate.work_history:
            if job.years >= STAGNATION_YEARS:
                same_role_years = job.years
                break
        if same_role_years >= STAGNATION_YEARS:
            penalty += 15

    # 3. Downward career trajectory
    if len(candidate.work_history) >= 2:
        first_role = candidate.work_history[0].role.lower()
        last_role = candidate.work_history[-1].role.lower()
        if "senior" in last_role and "junior" in first_role:
            pass  # This is actually growth (recent is first)
        elif "junior" in first_role and "senior" not in last_role and len(candidate.work_history) > 3:
            # Many jobs but no progression
            penalty += 10

    # 4. Very short most recent tenure
    if candidate.work_history:
        most_recent = candidate.work_history[0]
        if most_recent.years < 0.5:
            penalty += 10

    return round(min(100, penalty), 1)


def compute_all_scores(
    candidate: CandidateProfile,
    jd: JDAnalysisResponse,
    semantic_score: float,
) -> tuple[float, list[DimensionScore], list[SkillMatch]]:
    """
    Compute all 7 dimension scores and the final weighted score.
    Returns (total_score, dimension_scores, skill_matches).
    """
    # Compute each dimension
    tech_score, skill_matches = compute_technical_skills_score(candidate, jd)
    exp_score = compute_experience_score(candidate, jd)
    career_score = compute_career_trajectory_score(candidate)
    domain_score = compute_domain_knowledge_score(candidate, jd)
    behavioral_score = compute_behavioral_signals_score(candidate)
    red_flags = compute_red_flags_score(candidate)

    # Build dimension list
    dimensions = [
        DimensionScore(
            name="Semantic Similarity",
            score=round(semantic_score, 1),
            weight=SCORING_WEIGHTS["semantic_similarity"],
            weighted_score=round(semantic_score * SCORING_WEIGHTS["semantic_similarity"], 2),
            explanation=f"Overall profile-to-JD semantic match: {semantic_score:.0f}%",
        ),
        DimensionScore(
            name="Technical Skills",
            score=round(tech_score, 1),
            weight=SCORING_WEIGHTS["technical_skills"],
            weighted_score=round(tech_score * SCORING_WEIGHTS["technical_skills"], 2),
            explanation=_tech_explanation(skill_matches),
        ),
        DimensionScore(
            name="Experience Level",
            score=round(exp_score, 1),
            weight=SCORING_WEIGHTS["experience_level"],
            weighted_score=round(exp_score * SCORING_WEIGHTS["experience_level"], 2),
            explanation=f"{candidate.experience_years} years experience vs. {jd.experience.min_years}+ required",
        ),
        DimensionScore(
            name="Career Trajectory",
            score=round(career_score, 1),
            weight=SCORING_WEIGHTS["career_trajectory"],
            weighted_score=round(career_score * SCORING_WEIGHTS["career_trajectory"], 2),
            explanation=_career_explanation(candidate),
        ),
        DimensionScore(
            name="Domain Knowledge",
            score=round(domain_score, 1),
            weight=SCORING_WEIGHTS["domain_knowledge"],
            weighted_score=round(domain_score * SCORING_WEIGHTS["domain_knowledge"], 2),
            explanation=f"Industry experience relevance across {len(jd.domains)} target domains",
        ),
        DimensionScore(
            name="Behavioral Signals",
            score=round(behavioral_score, 1),
            weight=SCORING_WEIGHTS["behavioral_signals"],
            weighted_score=round(behavioral_score * SCORING_WEIGHTS["behavioral_signals"], 2),
            explanation=_behavioral_explanation(candidate),
        ),
        DimensionScore(
            name="Red Flags",
            score=round(red_flags, 1),
            weight=SCORING_WEIGHTS["red_flags"],
            weighted_score=round(-red_flags * SCORING_WEIGHTS["red_flags"], 2),
            explanation=_red_flag_explanation(candidate, red_flags),
        ),
    ]

    # Calculate total score
    total = (
        semantic_score * SCORING_WEIGHTS["semantic_similarity"] +
        tech_score * SCORING_WEIGHTS["technical_skills"] +
        exp_score * SCORING_WEIGHTS["experience_level"] +
        career_score * SCORING_WEIGHTS["career_trajectory"] +
        domain_score * SCORING_WEIGHTS["domain_knowledge"] +
        behavioral_score * SCORING_WEIGHTS["behavioral_signals"] -
        red_flags * SCORING_WEIGHTS["red_flags"]
    )

    # Apply bonuses
    has_leadership = any("lead" in j.role.lower() or "manager" in j.role.lower()
                         or "head" in j.role.lower() for j in candidate.work_history)
    jd_needs_leadership = any(s.skill.lower() in ("leadership", "team management", "mentoring")
                              for s in jd.soft_skills)
    if has_leadership and jd_needs_leadership:
        total *= LEADERSHIP_BONUS

    # Learning velocity check
    if candidate.certifications and len(candidate.certifications) >= 2:
        total *= LEARNING_VELOCITY_BONUS

    total = round(min(100, max(0, total)), 1)

    return total, dimensions, skill_matches


def _tech_explanation(matches: list[SkillMatch]) -> str:
    """Generate explanation for technical skills score."""
    exact = sum(1 for m in matches if m.status == "match")
    partial = sum(1 for m in matches if m.status == "partial")
    missing = sum(1 for m in matches if m.status == "missing")
    total = len(matches)
    if total == 0:
        return "No specific technical skills required"
    return f"{exact}/{total} exact matches, {partial} transferable, {missing} gaps"


def _career_explanation(candidate: CandidateProfile) -> str:
    """Generate explanation for career trajectory."""
    if not candidate.work_history:
        return "Limited work history data"
    roles = [j.role for j in candidate.work_history[:3]]
    return f"Career path: {' → '.join(reversed(roles))}"


def _behavioral_explanation(candidate: CandidateProfile) -> str:
    """Generate explanation for behavioral signals."""
    signals = []
    if candidate.certifications:
        signals.append(f"{len(candidate.certifications)} certification(s)")
    if candidate.github:
        signals.append("GitHub presence")
    if not signals:
        return "Limited behavioral signals detected"
    return "Positive signals: " + ", ".join(signals)


def _red_flag_explanation(candidate: CandidateProfile, penalty: float) -> str:
    """Generate explanation for red flags."""
    if penalty < 5:
        return "No significant red flags detected"
    flags = []
    if candidate.work_history:
        tenures = [j.years for j in candidate.work_history if j.years > 0]
        if tenures and sum(tenures) / len(tenures) < 1.5:
            flags.append("Short average tenure")
    if penalty > 30:
        flags.append("Significant job hopping pattern")
    return "Concerns: " + ", ".join(flags) if flags else "Minor concerns detected"
