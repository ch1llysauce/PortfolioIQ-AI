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
| **ML Project Classification** | Hybrid Scikit-Learn TF-IDF + Logistic Regression model with keyword affinity scoring across 6 software engineering domains |
| **Skill Gap Analysis** | Compares your skills against target role requirements and shows what's missing with visual radar charts |
| **Portfolio Optimizer** | Knapsack-based mathematical optimizer recommends the highest-ROI projects to build next within an effort hour budget |
| **AI Dynamic Blueprint** | Groq LLM generates custom project blueprints tailored to your exact skill gaps |
| **AI Developer Coach** | Context-aware chat coach powered by Groq with real-time portfolio awareness and critique capabilities |
| **GitHub Scanner & Multi-Language Sync** | Scans public GitHub repos with concurrent multi-language detection (`languages_url`) and skill mapping |
| **Pre-Import AI Analysis** | Live ML domain prediction and probability distribution preview directly from GitHub repository cards |
| **Knowledge Graph** | NetworkX-based ontology of 125+ technologies and 475+ relationships with skill trees and learning paths per role |
| **Resume ATS Intelligence** | PDF resume parser with NLP skill extraction and ATS compatibility scoring |
| **Mobile & PWA Ready** | Web App Manifest with safe-zone adaptive icons, maskable PWA icons, and Apple Touch Icon support |
| **Secure Auth & Recovery** | Segmented 6-box OTP cards, real-time rate limit countdowns, and GitHub OAuth |
| **Light / Dark Mode** | Dynamic theme switching with matching branding, favicons, and accessible high-contrast palettes |
| **Profile & Avatar Engine** | Client-side 10MB image upload with Canvas compression and persistent customization |

---

## Tech Stack

### Frontend
- **Angular 22** (modular standalone components, signals-based reactive state)
- **TypeScript 5.8+**
- **Supabase JS** (auth, database, storage)
- **HTML5 Canvas** (client-side avatar image compression)
- **Web App Manifest & PWA** (mobile home screen installation & maskable adaptive icons)

### Backend
- **FastAPI** (asynchronous Python framework)
- **Scikit-Learn** (TF-IDF + Logistic Regression classifier)
- **NetworkX** (knowledge graph ontology)
- **Groq API** (Llama 3 LLM — AI Coach and Blueprint generation)
- **httpx** (async client for concurrent GitHub API scanning)
- **PyPDF** (resume PDF parsing)

### Infrastructure
- **Supabase** (PostgreSQL, Auth, Storage)
- **Vercel** (frontend deployment)
- **Render** (backend deployment)

---

## Architecture

```
Angular 22 Frontend (Vercel)
         │
         │ REST API (JSON / Async)
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
GitHub API (concurrent repo & language scanning)
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
GITHUB_TOKEN=your_github_token      # optional but recommended (5000 req/hr vs 60)
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
├── frontend/                       # Angular app
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.ts              # Root coordinator (signals state)
│   │   │   ├── app.html / app.css  # Shell template & responsive styles
│   │   │   ├── layout/             # Header, Sidebar
│   │   │   ├── pages/              # Dashboard, Projects, Skills, Career, GitHub, Coach, Resume, Optimization, Analytics
│   │   │   ├── modals/             # Auth, Project, GitHub Import, AI Analysis, Resume, Skill Picker, Confirm
│   │   │   └── services/           # API, Auth, GitHub, ML, Skills, Analytics services
│   │   ├── environments/           # environment.ts / environment.prod.ts
│   │   ├── index.html              # HTML entry with PWA & mobile icon tags
│   │   └── styles.css              # Global styling & fonts
│   ├── public/                     # Static assets (manifest.json, mobile safe icons, branding)
│   └── vercel.json                 # Vercel SPA rewrites
│
├── backend/                        # FastAPI app
│   ├── app/
│   │   ├── main.py                 # App entry & CORS
│   │   ├── routes/                 # analytics, ml, github, coach, knowledge, system
│   │   ├── analytics/              # scoring, resume parser, skill gap
│   │   ├── ai/                     # Groq LLM coach
│   │   ├── github/                 # GitHub async client with multi-language parsing
│   │   ├── knowledge/              # Knowledge graph ontology & learning paths
│   │   └── optimization/           # Knapsack optimizer & constraints
│   ├── database/                   # SQL schemas
│   └── requirements.txt
│
├── ml/                             # ML training and inference
│   ├── classifier.py               # Hybrid TF-IDF + Logistic Regression inference
│   ├── train_model.py              # Model training script
│   ├── models/                     # Serialized joblib classifier model
│   └── data/                       # Training dataset (GitHub projects CSV)
│
├── docs/                           # Architecture and development docs
├── render.yaml                     # Render deployment config
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

Prediction uses a hybrid approach: **60% ML probability + 40% keyword domain affinity scoring** for calibrated results on multi-stack projects.

If the model file is missing on deployment, it automatically retrains from `ml/data/github_projects.csv`.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Backend health check |
| `/api/analytics/portfolio-score` | POST | Calculate portfolio health score |
| `/api/analytics/skill-gap` | POST | Compute skill gap against target role |
| `/api/analytics/parse-resume` | POST | Parse PDF resume and extract skills |
| `/api/ml/classify-project` | POST | Classify a project by domain using hybrid ML |
| `/api/github/scan/{username}` | GET | Scan GitHub profile with multi-language detection |
| `/api/coach/chat` | POST | Send message to AI coach |
| `/api/coach/critique` | POST | Generate portfolio critique |
| `/api/optimization/recommend` | POST | Run knapsack portfolio optimizer |
| `/api/optimization/generate-custom-blueprint` | POST | Generate AI project blueprint |
| `/api/knowledge/graph` | GET | Fetch full knowledge graph |
| `/api/knowledge/role-tree/{role}` | GET | Get skill tree for a role |
| `/api/knowledge/learning-path` | POST | Compute learning path to a skill |

---

## License

MIT
