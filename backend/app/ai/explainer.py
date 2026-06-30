from __future__ import annotations
"""
Explainability Engine — Generates human-readable explanations for each candidate's ranking.
Uses heuristic analysis to produce detailed, evidence-based explanations.
"""
from app.utils.validators import (
    CandidateProfile, JDAnalysisResponse,
    CandidateExplanation, StrengthItem, DevelopmentArea,
    DimensionScore, SkillMatch, RiskLevel, PotentialLevel,
)


def generate_explanation(
    candidate: CandidateProfile,
    jd: JDAnalysisResponse,
    total_score: float,
    dimensions: list[DimensionScore],
    skill_matches: list[SkillMatch],
    rank: int,
) -> CandidateExplanation:
    """Generate a comprehensive explanation for a candidate's ranking."""

    executive_summary = _generate_executive_summary(candidate, jd, total_score)
    strengths = _generate_strengths(candidate, jd, dimensions, skill_matches)
    development_areas = _generate_development_areas(candidate, jd, skill_matches)
    why_ranking = _generate_why_ranking(candidate, jd, total_score, dimensions, rank)
    risk_level, risk_details = _assess_risk(candidate, dimensions)
    potential_level, potential_explanation = _assess_potential(candidate, dimensions)

    return CandidateExplanation(
        executive_summary=executive_summary,
        strengths=strengths,
        development_areas=development_areas,
        why_this_ranking=why_ranking,
        risk_assessment=risk_level,
        risk_details=risk_details,
        long_term_potential=potential_level,
        potential_explanation=potential_explanation,
    )


def _generate_executive_summary(
    candidate: CandidateProfile,
    jd: JDAnalysisResponse,
    score: float,
) -> str:
    """Generate a one-sentence executive summary."""
    exp = f"{candidate.experience_years} years" if candidate.experience_years else "varied"
    skills_str = ", ".join(candidate.skills[:3]) if candidate.skills else "diverse skills"

    if score >= 90:
        fit = "Exceptional fit"
    elif score >= 80:
        fit = "Strong fit"
    elif score >= 70:
        fit = "Good fit"
    elif score >= 60:
        fit = "Moderate fit"
    else:
        fit = "Partial fit"

    title_part = f" ({candidate.title})" if candidate.title else ""
    return f"{fit} — {candidate.name}{title_part} with {exp} experience in {skills_str}, scoring {score:.0f}% against {jd.title} requirements."


def _generate_strengths(
    candidate: CandidateProfile,
    jd: JDAnalysisResponse,
    dimensions: list[DimensionScore],
    skill_matches: list[SkillMatch],
) -> list[StrengthItem]:
    """Generate strength bullets with evidence."""
    strengths: list[StrengthItem] = []

    # 1. Experience strength
    if candidate.experience_years >= jd.experience.min_years:
        if candidate.experience_years > jd.experience.preferred_years:
            strengths.append(StrengthItem(
                text=f"{candidate.experience_years} years experience exceeds {jd.experience.min_years}+ requirement",
                evidence=f"JD requires {jd.experience.min_years}+ years, candidate has {candidate.experience_years} ✓ Exceeds requirement",
            ))
        else:
            strengths.append(StrengthItem(
                text=f"{candidate.experience_years} years experience meets the requirement",
                evidence=f"JD requires {jd.experience.min_years}+ years ✓ Meets requirement",
            ))

    # 2. Skill match strengths
    exact_matches = [m for m in skill_matches if m.status == "match"]
    if exact_matches:
        top_matches = exact_matches[:3]
        skills_list = ", ".join(m.skill for m in top_matches)
        strengths.append(StrengthItem(
            text=f"Direct match on key skills: {skills_list}",
            evidence=f"{len(exact_matches)} out of {len(skill_matches)} required skills are exact matches ✓",
        ))

    # 3. Transferable skills
    partial_matches = [m for m in skill_matches if m.status == "partial"]
    if partial_matches:
        best = max(partial_matches, key=lambda m: m.transfer_score)
        strengths.append(StrengthItem(
            text=f"Transferable skill: {best.candidate_skill} → {best.skill} ({int(best.transfer_score * 100)}% transfer)",
            evidence=best.explanation,
        ))

    # 4. Career trajectory
    career_dim = next((d for d in dimensions if d.name == "Career Trajectory"), None)
    if career_dim and career_dim.score >= 75:
        strengths.append(StrengthItem(
            text="Strong career trajectory showing consistent growth",
            evidence=career_dim.explanation,
        ))

    # 5. Certifications
    if candidate.certifications:
        certs = ", ".join(candidate.certifications[:3])
        strengths.append(StrengthItem(
            text=f"Professional certifications: {certs}",
            evidence="Demonstrates continuous learning and growth mindset ✓",
        ))

    # 6. Leadership experience
    leadership_roles = [j for j in candidate.work_history
                        if any(w in j.role.lower() for w in ["lead", "senior", "manager", "head", "principal"])]
    if leadership_roles:
        role = leadership_roles[0]
        strengths.append(StrengthItem(
            text=f"Leadership experience as {role.role} at {role.company}",
            evidence=role.achievements[:100] if role.achievements else "Demonstrated leadership capability",
        ))

    # 7. Achievement highlights
    for job in candidate.work_history[:2]:
        if job.achievements and any(w in job.achievements.lower() for w in
                                     ["built", "scaled", "improved", "increased", "led", "architected"]):
            strengths.append(StrengthItem(
                text=f"Impact at {job.company}: {job.achievements[:80]}",
                evidence=f"As {job.role} for {job.years} years",
            ))
            break

    return strengths[:6]  # Cap at 6 strengths


def _generate_development_areas(
    candidate: CandidateProfile,
    jd: JDAnalysisResponse,
    skill_matches: list[SkillMatch],
) -> list[DevelopmentArea]:
    """Generate development area bullets with suggestions."""
    areas: list[DevelopmentArea] = []

    # 1. Missing skills
    missing = [m for m in skill_matches if m.status == "missing"]
    for m in missing[:3]:
        areas.append(DevelopmentArea(
            text=f"Missing: {m.skill}",
            suggestion=f"Can be learned through online courses or on-the-job training",
        ))

    # 2. Experience gap
    if candidate.experience_years < jd.experience.min_years:
        gap = jd.experience.min_years - candidate.experience_years
        areas.append(DevelopmentArea(
            text=f"Experience gap: {gap:.1f} years below minimum requirement",
            suggestion="May compensate with demonstrated skill depth and fast learning",
        ))

    # 3. Limited domain exposure
    if jd.domains:
        candidate_text = " ".join([candidate.title or "", candidate.summary or ""] +
                                   [j.company + " " + j.role for j in candidate.work_history]).lower()
        missing_domains = [d for d in jd.domains if d.lower() not in candidate_text]
        if missing_domains:
            areas.append(DevelopmentArea(
                text=f"Limited exposure to {', '.join(missing_domains[:2])} domain(s)",
                suggestion="Core technical skills may transfer; domain knowledge can be acquired",
            ))

    # 4. No certifications
    if not candidate.certifications:
        areas.append(DevelopmentArea(
            text="No professional certifications listed",
            suggestion="Relevant certifications would strengthen the profile",
        ))

    # 5. Short tenure history
    if candidate.work_history:
        tenures = [j.years for j in candidate.work_history if j.years > 0]
        if tenures and sum(tenures) / len(tenures) < 2:
            areas.append(DevelopmentArea(
                text="Relatively short average tenure across roles",
                suggestion="Discuss reasons during interview — may be valid career moves",
            ))

    return areas[:5]  # Cap at 5 areas


def _generate_why_ranking(
    candidate: CandidateProfile,
    jd: JDAnalysisResponse,
    score: float,
    dimensions: list[DimensionScore],
    rank: int,
) -> str:
    """Generate a narrative explanation of why this candidate is at this rank."""
    parts = []

    parts.append(f"{candidate.name} ranks #{rank} with a {score:.0f}% fit score for the {jd.title} position.")

    # Top scoring dimensions
    sorted_dims = sorted(
        [d for d in dimensions if d.name != "Red Flags"],
        key=lambda d: d.score,
        reverse=True,
    )

    if sorted_dims:
        top = sorted_dims[0]
        parts.append(f"Their strongest dimension is {top.name} at {top.score:.0f}%.")

    # Weakest dimension
    if len(sorted_dims) >= 2:
        bottom = sorted_dims[-1]
        if bottom.score < 60:
            parts.append(f"The main gap is in {bottom.name} ({bottom.score:.0f}%).")

    # Deduction explanation
    deduction = 100 - score
    if deduction > 0:
        red_flag_dim = next((d for d in dimensions if d.name == "Red Flags"), None)
        if red_flag_dim and red_flag_dim.score > 10:
            parts.append(f"A {deduction:.0f}% deduction comes from skill gaps and {red_flag_dim.explanation.lower()}.")
        else:
            parts.append(f"The {deduction:.0f}% deduction is primarily from non-critical skill gaps.")

    # Career context
    if candidate.work_history:
        recent = candidate.work_history[0]
        parts.append(f"Most recently worked as {recent.role} at {recent.company} for {recent.years} years.")

    return " ".join(parts)


def _assess_risk(
    candidate: CandidateProfile,
    dimensions: list[DimensionScore],
) -> tuple[RiskLevel, list[str]]:
    """Assess risk level for hiring this candidate."""
    risks: list[str] = []

    red_flag_dim = next((d for d in dimensions if d.name == "Red Flags"), None)
    red_flag_score = red_flag_dim.score if red_flag_dim else 0

    # Job hopping
    if candidate.work_history:
        tenures = [j.years for j in candidate.work_history if j.years > 0]
        if tenures and sum(tenures) / len(tenures) < 1:
            risks.append("Pattern of short tenures may indicate retention risk")

    # Very recent job change
    if candidate.work_history and candidate.work_history[0].years < 0.5:
        risks.append("Very recent role change — may not be ready to move again")

    # Overqualification
    experience_dim = next((d for d in dimensions if d.name == "Experience Level"), None)
    if experience_dim and candidate.experience_years > 10 and experience_dim.score < 80:
        risks.append("May be overqualified — risk of underutilization")

    if not risks:
        return RiskLevel.NONE, []
    elif len(risks) == 1 and red_flag_score < 20:
        return RiskLevel.LOW, risks
    elif red_flag_score >= 30:
        return RiskLevel.HIGH, risks
    else:
        return RiskLevel.MEDIUM, risks


def _assess_potential(
    candidate: CandidateProfile,
    dimensions: list[DimensionScore],
) -> tuple[PotentialLevel, str]:
    """Assess long-term growth potential."""
    signals = 0
    reasons = []

    # Learning velocity: certifications
    if candidate.certifications and len(candidate.certifications) >= 2:
        signals += 2
        reasons.append("multiple certifications show continuous learning")

    # Career growth
    career_dim = next((d for d in dimensions if d.name == "Career Trajectory"), None)
    if career_dim and career_dim.score >= 80:
        signals += 2
        reasons.append("strong upward career trajectory")

    # GitHub / open source
    if candidate.github:
        signals += 1
        reasons.append("active GitHub presence")

    # Behavioral signals
    behavioral_dim = next((d for d in dimensions if d.name == "Behavioral Signals"), None)
    if behavioral_dim and behavioral_dim.score >= 75:
        signals += 1
        reasons.append("strong behavioral signals")

    # Experience breadth
    if len(candidate.work_history) >= 3:
        unique_companies = len(set(j.company for j in candidate.work_history))
        if unique_companies >= 3:
            signals += 1
            reasons.append("diverse company experience")

    if signals >= 5:
        level = PotentialLevel.EXCEPTIONAL
    elif signals >= 3:
        level = PotentialLevel.HIGH
    elif signals >= 1:
        level = PotentialLevel.MEDIUM
    else:
        level = PotentialLevel.LOW

    explanation = f"Potential assessment based on: {', '.join(reasons)}" if reasons else "Limited data for potential assessment"
    return level, explanation
