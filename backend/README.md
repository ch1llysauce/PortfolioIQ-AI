# PortfolioIQ AI — Backend

FastAPI backend for the PortfolioIQ AI platform.

**Live API:** [portfolioiq-backend.onrender.com](https://portfolioiq-backend.onrender.com)  
**API Docs:** [portfolioiq-backend.onrender.com/docs](https://portfolioiq-backend.onrender.com/docs)

---

## Stack

- **FastAPI** — REST API framework
- **Scikit-Learn** — ML project classifier (TF-IDF + Logistic Regression)
- **NetworkX** — Knowledge graph
- **Groq API** — AI Coach and Blueprint generation (Llama 3)
- **httpx** — GitHub API client
- **PyPDF** — Resume PDF parsing
- **Supabase** — Auth (JWT validation via frontend)

---

## Local Development

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Copy and fill in the environment file:

```bash
cp .env.example .env
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

API available at `http://localhost:8000`  
Interactive docs at `http://localhost:8000/docs`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key for AI Coach and Blueprint generation |
| `GITHUB_TOKEN` | Recommended | GitHub Personal Access Token — increases rate limit from 60 to 5000 req/hr |
| `FRONTEND_URL` | Yes (prod) | Frontend URL for CORS — e.g. `https://portfolio-iq-ai.vercel.app` |

---

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Backend health check |
| GET | `/api/system/status` | Full system telemetry |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analytics/portfolio-score` | Calculate 100-point portfolio health score |
| POST | `/api/analytics/skill-gap` | Compute skill gap against a target role |
| POST | `/api/analytics/parse-resume` | Parse PDF resume and extract skills via NLP |

### Machine Learning
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ml/classify-project` | Classify project domain using ML |

### GitHub
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/github/status` | GitHub API status and rate limit |
| GET | `/api/github/scan/{username}` | Scan GitHub profile — repos, skills, domains |

### AI Coach
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coach/status` | Coach availability and active model |
| POST | `/api/coach/chat` | Send message to AI Developer Coach |
| POST | `/api/coach/critique` | Generate full portfolio critique |
| POST | `/api/coach/project-ideas` | Generate project ideas based on skill gaps |

### Optimization
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/optimization/recommend` | Run knapsack optimizer for project recommendations |
| POST | `/api/optimization/generate-custom-blueprint` | Generate AI-synthesized project blueprint |

### Knowledge Graph
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/knowledge/graph` | Full knowledge graph (nodes + edges) |
| GET | `/api/knowledge/role-tree/{role}` | Skill tree for a career role |
| GET | `/api/knowledge/prerequisites/{skill}` | Prerequisites for a skill |
| GET | `/api/knowledge/unlocked-skills/{skill}` | Skills unlocked by learning a skill |
| GET | `/api/knowledge/complements/{tech}` | Technologies commonly paired with a tech |
| POST | `/api/knowledge/learning-path` | Compute ordered learning path to a goal skill |
| POST | `/api/knowledge/extract` | Extract skills/technologies from raw text |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app + CORS config
│   ├── routes/
│   │   ├── analytics.py     # Portfolio scoring, skill gap, resume parsing
│   │   ├── ml.py            # ML classification endpoint
│   │   ├── github.py        # GitHub scan endpoint
│   │   ├── coach.py         # AI Coach (Groq)
│   │   ├── optimization.py  # Portfolio optimizer
│   │   ├── knowledge.py     # Knowledge graph endpoints
│   │   └── system.py        # System telemetry
│   ├── analytics/
│   │   ├── portfolio_scoring.py
│   │   ├── resume_parser.py
│   │   └── skill_gap.py
│   ├── ai/
│   │   └── groq_coach.py    # Groq LLM integration
│   ├── github/
│   │   └── github_client.py # httpx-based GitHub API client
│   ├── knowledge/
│   │   ├── knowledge_graph.py
│   │   ├── entity_extractor.py
│   │   ├── retrieval.py
│   │   └── data/            # JSON knowledge base files
│   └── optimization/
│       ├── portfolio_optimizer.py
│       ├── objective_functions.py
│       └── constraints.py
├── database/                # SQL schema files
├── requirements.txt
└── .env.example
```

---

## Deploy to Render

Configured via `render.yaml` in the project root:

- **Runtime:** Python
- **Root directory:** `backend`
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Set these environment variables in the Render dashboard:
- `GROQ_API_KEY`
- `GITHUB_TOKEN`
- `FRONTEND_URL` → your Vercel URL

> **Note:** Render free tier spins down after inactivity. Expect ~30 second cold start on first request.
