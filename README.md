# PortfolioIQ AI

**AI-Powered Developer Portfolio Analysis, Skill Gap Detection, and Career Optimization Platform**

Live Demo: [portfolio-iq-ai.vercel.app](https://portfolio-iq-ai.vercel.app)

---

## Overview

PortfolioIQ AI is an intelligent platform that analyzes a developer's projects and technical skills to provide data-driven career guidance. Unlike traditional portfolio sites that just display work, PortfolioIQ evaluates the portfolio itself and tells you what to improve and what to build next.

The system combines machine learning classification, mathematical optimization, knowledge graph reasoning, and generative AI to produce a complete picture of a developer's technical profile.

---

## Features

| Module | Description |
|--------|-------------|
| **Portfolio Health Score** | 100-point scoring model across skill coverage, project volume, detail quality, and activity status |
| **ML Project Classification** | Scikit-Learn TF-IDF + Logistic Regression classifier predicts project domain (Web, AI/ML, Mobile, etc.) |
| **Skill Gap Analysis** | Compares your skills against target role requirements and shows what's missing |
| **Portfolio Optimizer** | Knapsack-based mathematical optimizer recommends the highest-ROI projects to build next |
| **AI Dynamic Blueprint** | Groq LLM generates custom project blueprints tailored to your exact skill gaps |
| **AI Developer Coach** | Context-aware chat coach powered by Groq with portfolio awareness |
| **GitHub Profile Scanner** | Scans public GitHub repos, extracts tech stacks via NLP, classifies domains via ML |
| **Knowledge Graph** | NetworkX-based ontology of 125+ technologies and 475+ relationships with skill trees per role |
| **Resume ATS Intelligence** | PDF resume parser with NLP skill extraction and ATS compatibility scoring |
| **Light / Dark Mode** | Full theme support persisted across sessions |

---

## Tech Stack

### Frontend
- **Angular 22** (standalone components, signals)
- **TypeScript**
- **Supabase JS** (auth, database, storage)

### Backend
- **FastAPI** (Python)
- **Scikit-Learn** (TF-IDF + Logistic Regression classifier)
- **NetworkX** (knowledge graph)
- **Groq API** (LLM — AI Coach and Blueprint generation)
- **httpx** (GitHub API client)
- **PyPDF** (resume PDF parsing)

### Infrastructure
- **Supabase** (PostgreSQL, Auth, Storage)
- **Vercel** (frontend deployment)
- **Render** (backend deployment)

---

## Architecture

```
Angular Frontend (Vercel)
         │
         │ REST API
         ▼
FastAPI Backend (Render)
         │
    ┌────┼────────────┐
    ▼    ▼            ▼
  ML   Analytics   Knowledge
  │      │         Graph
  │      │            │
  └──────┴────────────┘
         │
         ▼
      Groq LLM
         │
         ▼
   AI Coach / Blueprint

Supabase (Auth + DB + Storage)
GitHub API (repo scanning)
```

---

## Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- Angular CLI 22+

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Copy the environment file and fill in your keys:

```bash
cp .env.example .env
```

Required environment variables:

```
GROQ_API_KEY=your_groq_api_key
GITHUB_TOKEN=your_github_token      # optional but recommended
FRONTEND_URL=http://localhost:4200
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
ng serve
```

App available at: `http://localhost:4200`

---

## Deployment

### Frontend — Vercel
- Root directory: `frontend`
- Build command: `ng build --configuration=production`
- Output directory: `dist/portfolioiq-frontend/browser`
- Environment variables: set in `src/environments/environment.prod.ts`

### Backend — Render
- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Environment variables: set in Render dashboard (`GROQ_API_KEY`, `GITHUB_TOKEN`, `FRONTEND_URL`)

### Supabase
- Auth: GitHub OAuth enabled
- Redirect URLs: add both `http://localhost:4200` and your Vercel URL
- Site URL: set to your Vercel URL for production

---

## Project Structure

```
PortfolioIQ-AI/
├── frontend/               # Angular app
│   └── src/
│       ├── app/
│       │   ├── app.ts      # Main component (signals-based)
│       │   ├── app.html    # Template
│       │   ├── app.css     # Global styles + light/dark theme
│       │   └── services/   # API, auth, GitHub, ML, etc.
│       └── environments/   # environment.ts / environment.prod.ts
│
├── backend/                # FastAPI app
│   └── app/
│       ├── main.py
│       ├── routes/         # analytics, ml, github, coach, knowledge, etc.
│       ├── analytics/      # portfolio scoring, skill gap, resume parser
│       ├── ai/             # Groq coach
│       ├── github/         # GitHub API client
│       ├── knowledge/      # knowledge graph, entity extractor
│       └── optimization/   # knapsack optimizer
│
├── ml/                     # ML training and inference
│   ├── classifier.py       # Inference — TF-IDF + Logistic Regression
│   ├── train_model.py      # Training script
│   ├── models/             # Trained joblib model
│   └── data/               # Training dataset (GitHub projects CSV)
│
├── docs/                   # Project documentation
├── render.yaml             # Render deployment config
└── README.md
```

---

## ML Model

The project classifier uses a **Scikit-Learn pipeline** (TF-IDF vectorizer + Logistic Regression) trained on a labeled GitHub project dataset. It classifies projects into 6 domains:

- Web Development
- Mobile Development
- AI / Machine Learning
- Data Science & Analytics
- Cloud & DevOps
- Cybersecurity & Systems

Prediction uses a hybrid approach: 60% ML probability + 40% keyword domain affinity scoring for better calibration on multi-domain projects.

If the model file is missing on deployment, it auto-retrains from `ml/data/github_projects.csv`.

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Backend health check |
| `POST /api/analytics/portfolio-score` | Calculate portfolio health score |
| `POST /api/analytics/skill-gap` | Compute skill gap against target role |
| `POST /api/analytics/parse-resume` | Parse PDF resume and extract skills |
| `POST /api/ml/classify-project` | Classify a project by domain |
| `GET /api/github/scan/{username}` | Scan GitHub profile and repos |
| `POST /api/coach/chat` | Send message to AI coach |
| `POST /api/coach/critique` | Generate portfolio critique |
| `POST /api/optimization/recommend` | Run knapsack portfolio optimizer |
| `POST /api/optimization/generate-custom-blueprint` | Generate AI project blueprint |
| `GET /api/knowledge/graph` | Fetch full knowledge graph |
| `GET /api/knowledge/role-tree/{role}` | Get skill tree for a role |
| `POST /api/knowledge/learning-path` | Compute learning path to a skill |

---

## License

MIT
