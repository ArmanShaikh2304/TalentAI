from __future__ import annotations
"""
Constants and configuration for the AI Candidate Ranking System.
"""

# ─── Scoring Weights (must sum to ~1.0) ───
SCORING_WEIGHTS = {
    "semantic_similarity": 0.40,
    "technical_skills": 0.25,
    "experience_level": 0.15,
    "career_trajectory": 0.10,
    "domain_knowledge": 0.05,
    "behavioral_signals": 0.03,
    "red_flags": 0.02,  # This is subtracted
}

# ─── Bonus Multipliers ───
LEADERSHIP_BONUS = 1.05
LEARNING_VELOCITY_BONUS = 1.03
QUICK_RAMPUP_BONUS = 1.02

# ─── Skill Transfer Matrix ───
# Maps skill → list of (related_skill, transfer_percentage)
SKILL_TRANSFER_MATRIX = {
    "python": [("java", 0.70), ("javascript", 0.50), ("go", 0.60), ("ruby", 0.65), ("c++", 0.55), ("typescript", 0.50), ("c#", 0.60)],
    "java": [("python", 0.70), ("c#", 0.85), ("kotlin", 0.90), ("scala", 0.75), ("c++", 0.70), ("go", 0.55)],
    "javascript": [("typescript", 0.95), ("python", 0.50), ("react", 0.60), ("node.js", 0.85), ("vue", 0.70), ("angular", 0.65)],
    "typescript": [("javascript", 0.95), ("python", 0.45), ("react", 0.60), ("node.js", 0.80), ("angular", 0.70)],
    "react": [("vue", 0.75), ("angular", 0.60), ("javascript", 0.60), ("next.js", 0.85), ("react native", 0.80)],
    "vue": [("react", 0.75), ("angular", 0.60), ("javascript", 0.55), ("nuxt", 0.85)],
    "angular": [("react", 0.55), ("vue", 0.55), ("typescript", 0.70)],
    "aws": [("azure", 0.75), ("gcp", 0.75), ("cloud computing", 0.90), ("docker", 0.50)],
    "azure": [("aws", 0.75), ("gcp", 0.75), ("cloud computing", 0.90)],
    "gcp": [("aws", 0.75), ("azure", 0.75), ("cloud computing", 0.90)],
    "docker": [("kubernetes", 0.70), ("containerization", 0.95), ("devops", 0.50)],
    "kubernetes": [("docker", 0.70), ("containerization", 0.80), ("devops", 0.60)],
    "postgresql": [("mysql", 0.85), ("sql", 0.95), ("mongodb", 0.40), ("database", 0.90)],
    "mysql": [("postgresql", 0.85), ("sql", 0.95), ("database", 0.90)],
    "mongodb": [("nosql", 0.90), ("database", 0.70), ("redis", 0.40)],
    "redis": [("caching", 0.90), ("mongodb", 0.35), ("memcached", 0.85)],
    "machine learning": [("deep learning", 0.75), ("data science", 0.80), ("ai", 0.85), ("nlp", 0.60), ("computer vision", 0.55)],
    "deep learning": [("machine learning", 0.80), ("tensorflow", 0.70), ("pytorch", 0.70), ("ai", 0.80)],
    "tensorflow": [("pytorch", 0.80), ("deep learning", 0.70), ("keras", 0.90)],
    "pytorch": [("tensorflow", 0.80), ("deep learning", 0.70)],
    "spring": [("spring boot", 0.95), ("java", 0.60), ("microservices", 0.50)],
    "spring boot": [("spring", 0.95), ("java", 0.60), ("microservices", 0.55)],
    "flask": [("django", 0.70), ("fastapi", 0.80), ("python", 0.50)],
    "django": [("flask", 0.70), ("fastapi", 0.75), ("python", 0.50)],
    "fastapi": [("flask", 0.75), ("django", 0.70), ("python", 0.50)],
    "node.js": [("express", 0.85), ("javascript", 0.80), ("typescript", 0.75), ("nest.js", 0.70)],
    "express": [("node.js", 0.85), ("fastify", 0.80), ("koa", 0.80)],
    "graphql": [("rest api", 0.60), ("api design", 0.70)],
    "rest api": [("graphql", 0.50), ("api design", 0.80)],
    "microservices": [("distributed systems", 0.75), ("docker", 0.50), ("kubernetes", 0.50), ("service mesh", 0.60)],
    "distributed systems": [("microservices", 0.75), ("system design", 0.80), ("scalability", 0.70)],
    "ci/cd": [("devops", 0.80), ("jenkins", 0.70), ("github actions", 0.75)],
    "devops": [("ci/cd", 0.80), ("docker", 0.60), ("kubernetes", 0.55), ("terraform", 0.50)],
    "terraform": [("infrastructure as code", 0.90), ("devops", 0.50), ("aws", 0.35)],
    "agile": [("scrum", 0.90), ("kanban", 0.80), ("project management", 0.60)],
    "scrum": [("agile", 0.90), ("kanban", 0.75), ("project management", 0.55)],
    "leadership": [("team management", 0.85), ("mentoring", 0.80), ("project management", 0.60)],
    "mentoring": [("leadership", 0.75), ("team management", 0.70), ("coaching", 0.90)],
}

# ─── Red Flag Thresholds ───
JOB_HOPPING_THRESHOLD_MONTHS = 12  # Less than 1 year average tenure
MAX_CAREER_GAP_MONTHS = 12  # More than 1 year gap
STAGNATION_YEARS = 7  # Same role for 7+ years

# ─── Known Technical Skills (for extraction) ───
TECHNICAL_SKILLS = {
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "golang",
    "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
    "perl", "haskell", "elixir", "clojure", "dart", "lua",
    # Frontend
    "react", "vue", "angular", "svelte", "next.js", "nuxt", "gatsby",
    "html", "css", "sass", "less", "tailwind", "bootstrap", "material ui",
    "webpack", "vite", "babel", "jquery",
    # Backend
    "node.js", "express", "fastapi", "flask", "django", "spring", "spring boot",
    "nest.js", "rails", "laravel", "asp.net", "gin", "fiber",
    # Databases
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "cassandra",
    "dynamodb", "sqlite", "oracle", "sql server", "neo4j", "couchbase",
    "sql", "nosql",
    # Cloud & Infrastructure
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes",
    "terraform", "ansible", "jenkins", "github actions", "gitlab ci",
    "circleci", "nginx", "apache", "linux", "unix",
    # AI/ML
    "machine learning", "deep learning", "nlp", "computer vision",
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
    "spark", "hadoop", "data science", "data engineering", "airflow",
    # Architecture
    "microservices", "distributed systems", "system design", "api design",
    "graphql", "rest api", "grpc", "websockets", "message queues",
    "kafka", "rabbitmq", "event-driven",
    # DevOps & Tools
    "ci/cd", "devops", "git", "monitoring", "prometheus", "grafana",
    "datadog", "splunk", "elk stack", "logging",
    # Mobile
    "react native", "flutter", "ios", "android", "mobile development",
    # Other
    "agile", "scrum", "kanban", "jira", "confluence",
    "blockchain", "web3", "cybersecurity", "networking",
}

# ─── Soft Skills ───
SOFT_SKILLS = {
    "leadership", "communication", "teamwork", "problem solving",
    "critical thinking", "adaptability", "creativity", "mentoring",
    "coaching", "collaboration", "time management", "presentation",
    "negotiation", "conflict resolution", "empathy", "initiative",
    "ownership", "accountability", "decision making", "strategic thinking",
    "project management", "stakeholder management", "cross-functional",
}

# ─── Industry Domains ───
INDUSTRY_DOMAINS = {
    "fintech", "finance", "banking", "insurance",
    "e-commerce", "retail", "marketplace",
    "healthtech", "healthcare", "pharma",
    "edtech", "education",
    "saas", "enterprise", "b2b", "b2c",
    "social media", "content", "media",
    "logistics", "supply chain", "transportation",
    "real estate", "proptech",
    "gaming", "entertainment",
    "telecom", "iot",
    "cybersecurity", "security",
    "ai", "machine learning", "data",
    "cloud", "infrastructure",
    "automotive", "manufacturing",
    "travel", "hospitality",
    "agriculture", "agritech",
    "government", "public sector",
    "startup", "enterprise",
}

# ─── Seniority Levels ───
SENIORITY_LEVELS = {
    "intern": 0,
    "trainee": 0,
    "fresher": 0,
    "junior": 1,
    "associate": 1,
    "mid": 2,
    "mid-level": 2,
    "senior": 3,
    "lead": 4,
    "staff": 4,
    "principal": 5,
    "architect": 5,
    "director": 6,
    "vp": 7,
    "cto": 8,
    "head": 6,
    "manager": 4,
}

# ─── Culture Keywords Mapping ───
CULTURE_KEYWORDS = {
    "fast-paced": ["adaptability", "ownership", "initiative", "independent"],
    "startup": ["adaptability", "ownership", "initiative", "creativity", "ambiguity tolerance"],
    "enterprise": ["structured", "process-oriented", "stability", "documentation"],
    "remote": ["self-motivated", "communication", "time management", "async communication"],
    "collaborative": ["teamwork", "communication", "cross-functional"],
    "innovative": ["creativity", "problem solving", "experimentation"],
    "learning": ["growth mindset", "continuous learning", "curiosity"],
    "data-driven": ["analytical", "metrics-oriented", "evidence-based"],
}
