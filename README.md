# 🚀 TalentAI – Hiring Beyond Keywords

<p align="center">
  <b>An Explainable Candidate Intelligence Platform that ranks candidates beyond keyword matching using Semantic Search, Vector Embeddings, and AI-powered Re-ranking.</b>
</p>

---

## 📌 Problem Statement

Traditional Applicant Tracking Systems (ATS) rely heavily on exact keyword matching, causing highly qualified candidates to be overlooked despite having relevant experience and transferable skills.

TalentAI solves this by understanding both:

* 📄 Job Requirements
* 👨‍💼 Candidate Profiles

and intelligently ranking candidates based on genuine fit rather than simple keyword overlap.

---

## ✨ Features

### 🧠 Intelligent Job Description Understanding

* Extracts:

  * Required Skills
  * Experience Level
  * Domain Knowledge
  * Seniority Requirements
  * Behavioral Indicators

### 🔍 Semantic Candidate Search

* Finds relevant candidates beyond exact keyword matches.

### 📊 AI-Powered Re-ranking

Ranks candidates using:

* Semantic Similarity
* Experience Match
* Skill Coverage
* Career Progression
* Behavioral Signals

### 💡 Explainable AI

Provides reasons behind every recommendation.

Example:

```text
Candidate #1
✓ Strong cloud expertise
✓ 6 years of backend experience
✓ Leadership experience
✓ Similar domain projects
```

### ⚡ Fast Retrieval

Processes thousands of candidate profiles efficiently using vector search.

---

# 🏗 System Architecture

```text
Job Description
        ↓
LLM Requirement Extraction
        ↓
Embedding Generation
        ↓
FAISS Vector Database
        ↓
Semantic Search
        ↓
AI Re-ranking Engine
        ↓
Explainable Candidate Ranking
```

---

# 🛠 Tech Stack

## Backend

* Python
* FastAPI

## Frontend

* React.js
* Tailwind CSS

## AI & NLP

* Sentence Transformers
* OpenAI / Gemini
* Scikit-learn

## Vector Search

* FAISS

## Database

* SQLite / PostgreSQL

---

# 📂 Project Structure

```text
TalentAI/
│
├── backend/
├── frontend/
├── data/
├── docs/
├── models/
├── notebooks/
├── requirements.txt
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/ArmanShaikh2304/TalentAI.git
cd TalentAI
```

## Create Virtual Environment

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### Linux / Mac

```bash
source venv/bin/activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

# ▶️ Run Backend

```bash
uvicorn app.main:app --reload
```

---

# ▶️ Run Frontend

```bash
npm install
npm run dev
```

---

# 🔄 Workflow

1. Upload Job Description
2. Extract Requirements
3. Generate Embeddings
4. Retrieve Top Candidates
5. AI Re-ranking
6. Generate Explanations
7. Display Intelligent Shortlist

---


# 📈 Results

✅ Reduced manual screening time.

✅ Improved candidate-job matching.

✅ Explainable recommendations.

✅ Faster and fairer hiring decisions.

---

# 🔮 Future Enhancements

* Bias Detection
* Skill Gap Analysis
* Career Trajectory Prediction
* Recruiter Copilot
* Interview Readiness Score
* Multi-language Support

---

# 👥 Team

## Mind Matrix

* Ahanti Kiran Kadam
* Arman R. Shaikh

---

# 🏆 Built For

**India Runs – Data & AI Challenge 2026**

---

# 💡 Tagline

> **TalentAI – Hiring Beyond Keywords.**
>
> Because great talent deserves to be understood, not filtered.

---

## 📄 License

This project is licensed under the MIT License.
