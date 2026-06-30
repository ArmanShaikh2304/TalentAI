from __future__ import annotations
"""
JD Requirement Extractor — Parses job descriptions to extract structured requirements.
Uses heuristic NLP with keyword matching and pattern detection.
No external LLM API required.
"""
import re
import uuid
from app.utils.constants import (
    TECHNICAL_SKILLS, SOFT_SKILLS, INDUSTRY_DOMAINS,
    SENIORITY_LEVELS, CULTURE_KEYWORDS,
)
from app.utils.validators import (
    JDAnalysisRequest, JDAnalysisResponse,
    SkillRequirement, ExperienceRequirement, Proficiency,
)


def _normalize(text: str) -> str:
    """Lowercase and clean text for matching."""
    return re.sub(r'[^a-z0-9\s\+\#\./]', ' ', text.lower()).strip()


def _extract_technical_skills(text: str) -> list[SkillRequirement]:
    """Extract technical skills from JD text with proficiency and criticality."""
    normalized = _normalize(text)
    found_skills: list[SkillRequirement] = []
    seen = set()

    # Sort skills by length (longest first) to match multi-word skills first
    sorted_skills = sorted(TECHNICAL_SKILLS, key=len, reverse=True)

    for skill in sorted_skills:
        skill_lower = skill.lower()
        # Use word boundary matching for better accuracy
        pattern = r'(?:^|\s|,|;|\(|\/)' + re.escape(skill_lower) + r'(?:$|\s|,|;|\)|\.|\/)'
        if re.search(pattern, normalized) and skill_lower not in seen:
            seen.add(skill_lower)

            # Determine proficiency from context
            proficiency = Proficiency.INTERMEDIATE
            criticality = 0.5

            # Check if required vs preferred
            # Look for the skill in "required" vs "nice-to-have" sections
            skill_pos = normalized.find(skill_lower)
            surrounding = normalized[max(0, skill_pos - 200):skill_pos + 200]

            if any(w in surrounding for w in ["must have", "required", "essential", "mandatory", "core"]):
                criticality = 0.90
                proficiency = Proficiency.ADVANCED
            elif any(w in surrounding for w in ["strong", "expert", "deep", "extensive", "proven"]):
                criticality = 0.85
                proficiency = Proficiency.EXPERT
            elif any(w in surrounding for w in ["preferred", "nice to have", "bonus", "plus", "desirable"]):
                criticality = 0.40
                proficiency = Proficiency.INTERMEDIATE
            elif any(w in surrounding for w in ["familiar", "exposure", "basic", "awareness"]):
                criticality = 0.30
                proficiency = Proficiency.BEGINNER
            else:
                criticality = 0.65
                proficiency = Proficiency.INTERMEDIATE

            found_skills.append(SkillRequirement(
                skill=skill,
                proficiency=proficiency,
                criticality=round(criticality, 2),
                category="technical",
            ))

    # Sort by criticality descending
    found_skills.sort(key=lambda s: s.criticality, reverse=True)
    return found_skills


def _extract_soft_skills(text: str) -> list[SkillRequirement]:
    """Extract soft skills from JD text."""
    normalized = _normalize(text)
    found: list[SkillRequirement] = []
    seen = set()

    for skill in SOFT_SKILLS:
        skill_lower = skill.lower()
        if skill_lower in normalized and skill_lower not in seen:
            seen.add(skill_lower)
            criticality = 0.6 if any(w in normalized for w in ["required", "must"]) else 0.4
            found.append(SkillRequirement(
                skill=skill,
                proficiency=Proficiency.INTERMEDIATE,
                criticality=round(criticality, 2),
                category="soft",
            ))

    return found


def _extract_experience(text: str) -> ExperienceRequirement:
    """Extract experience requirements from JD text."""
    normalized = _normalize(text)

    # Pattern: "5+ years", "3-5 years", "minimum 5 years", etc.
    patterns = [
        r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)',
        r'(?:minimum|min|at least)\s*(\d+)\s*(?:years?|yrs?)',
        r'(\d+)\s*-\s*(\d+)\s*(?:years?|yrs?)',
        r'(\d+)\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)',
    ]

    min_years = 0
    preferred_years = 0

    for pattern in patterns:
        matches = re.findall(pattern, normalized)
        if matches:
            if isinstance(matches[0], tuple) and len(matches[0]) == 2:
                min_years = int(matches[0][0])
                preferred_years = int(matches[0][1])
            else:
                val = int(matches[0]) if isinstance(matches[0], str) else int(matches[0][0])
                min_years = val
                preferred_years = val + 2
            break

    # Extract domain requirements
    domains = []
    for domain in INDUSTRY_DOMAINS:
        if domain.lower() in normalized:
            domains.append(domain)

    return ExperienceRequirement(
        min_years=min_years,
        preferred_years=preferred_years,
        domains=domains,
    )


def _extract_hidden_requirements(text: str) -> list[str]:
    """
    Extract implicit/hidden requirements that aren't explicitly stated.
    Maps common JD phrases to underlying skills needed.
    """
    normalized = _normalize(text)
    hidden = []

    phrase_mappings = {
        "scalable": ["Distributed systems knowledge", "Performance optimization mindset", "Load testing experience"],
        "scale": ["System design for growth", "Horizontal scaling experience"],
        "fast-paced": ["Ability to work under pressure", "Quick decision making", "Comfort with ambiguity"],
        "startup": ["Ownership mentality", "Wearing multiple hats", "Self-directed work"],
        "millions of users": ["High-availability systems experience", "Performance monitoring expertise"],
        "lead": ["Mentoring junior developers", "Technical decision making", "Code review experience"],
        "architect": ["System design expertise", "Technology evaluation skills"],
        "cross-functional": ["Stakeholder communication", "Working with non-technical teams"],
        "production": ["On-call/incident response readiness", "Monitoring and alerting experience"],
        "deploy": ["CI/CD pipeline experience", "Infrastructure automation knowledge"],
        "mentor": ["Teaching and coaching ability", "Patience and communication skills"],
        "data-driven": ["Analytics and metrics understanding", "A/B testing experience"],
        "security": ["Security best practices awareness", "OWASP knowledge"],
        "compliance": ["Regulatory framework understanding", "Audit trail implementation"],
        "api": ["API design principles", "Documentation skills"],
        "real-time": ["Event-driven architecture knowledge", "WebSocket/streaming experience"],
        "optimize": ["Profiling and benchmarking skills", "Algorithm optimization"],
        "agile": ["Sprint planning participation", "Iterative development mindset"],
    }

    seen = set()
    for phrase, requirements in phrase_mappings.items():
        if phrase in normalized:
            for req in requirements:
                if req not in seen:
                    hidden.append(req)
                    seen.add(req)

    return hidden[:10]  # Cap at 10 hidden requirements


def _extract_culture_signals(text: str) -> list[str]:
    """Extract culture signals from JD text."""
    normalized = _normalize(text)
    signals = []

    for keyword, traits in CULTURE_KEYWORDS.items():
        if keyword in normalized:
            signals.extend(traits)

    return list(set(signals))[:8]


def _infer_title(text: str) -> str:
    """Try to infer job title from the description text."""
    normalized = _normalize(text)

    title_patterns = [
        r'(?:looking for|hiring|seeking)\s+(?:a|an)\s+(.+?)(?:\s+to\s+|\s+who\s+|\s+with\s+|\.)',
        r'(?:position|role|job)\s*:\s*(.+?)(?:\n|\.)',
    ]

    for pattern in title_patterns:
        match = re.search(pattern, normalized)
        if match:
            title = match.group(1).strip()
            if len(title) < 60:
                return title.title()

    # Fallback: look for common titles
    common_titles = [
        "senior backend engineer", "backend engineer", "frontend engineer",
        "full stack engineer", "full stack developer", "software engineer",
        "data engineer", "data scientist", "machine learning engineer",
        "devops engineer", "sre", "platform engineer", "tech lead",
        "engineering manager", "product engineer", "mobile developer",
    ]

    for title in common_titles:
        if title in normalized:
            return title.title()

    return "Software Engineer"


def analyze_job_description(request: JDAnalysisRequest) -> JDAnalysisResponse:
    """
    Main entry point: Analyze a job description and extract structured requirements.
    """
    text = request.description
    jd_id = str(uuid.uuid4())[:8]

    title = request.title if request.title else _infer_title(text)
    technical_skills = _extract_technical_skills(text)
    soft_skills = _extract_soft_skills(text)
    experience = _extract_experience(text)
    hidden_requirements = _extract_hidden_requirements(text)
    culture_signals = _extract_culture_signals(text)

    # Extract domains from experience
    domains = experience.domains

    return JDAnalysisResponse(
        jd_id=jd_id,
        title=title,
        technical_skills=technical_skills,
        soft_skills=soft_skills,
        experience=experience,
        hidden_requirements=hidden_requirements,
        culture_signals=culture_signals,
        domains=domains,
        raw_description=text,
    )
