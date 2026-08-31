# 1. Proposed File Structure

The project will use a modular architecture separating the **Angular frontend**, **FastAPI backend**, **machine learning components**, **optimization logic**, **knowledge representation**, and **AI services**.

```text
PortfolioIQ-AI/
│
├── frontend/
│   │
│   ├── src/
│   │   ├── app/
│   │   │   │
│   │   │   ├── core/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── services/
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── portfolio.service.ts
│   │   │   │   │   ├── analysis.service.ts
│   │   │   │   │   ├── recommendation.service.ts
│   │   │   │   │   └── ai-coach.service.ts
│   │   │   │   └── models/
│   │   │   │
│   │   │   ├── shared/
│   │   │   │   ├── components/
│   │   │   │   ├── pipes/
│   │   │   │   └── directives/
│   │   │   │
│   │   │   ├── features/
│   │   │   │   │
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── dashboard.component.ts
│   │   │   │   │   ├── dashboard.component.html
│   │   │   │   │   └── dashboard.component.css
│   │   │   │   │
│   │   │   │   ├── projects/
│   │   │   │   │   ├── project-list/
│   │   │   │   │   ├── project-details/
│   │   │   │   │   └── project-form/
│   │   │   │   │
│   │   │   │   ├── skills/
│   │   │   │   │   ├── skill-list/
│   │   │   │   │   └── skill-analysis/
│   │   │   │   │
│   │   │   │   ├── portfolio-analysis/
│   │   │   │   │   ├── health-score/
│   │   │   │   │   ├── skill-analysis/
│   │   │   │   │   ├── project-analysis/
│   │   │   │   │   └── technology-analysis/
│   │   │   │   │
│   │   │   │   ├── career/
│   │   │   │   │   ├── career-goal/
│   │   │   │   │   ├── skill-gap/
│   │   │   │   │   └── role-alignment/
│   │   │   │   │
│   │   │   │   ├── optimization/
│   │   │   │   │   ├── portfolio-optimization/
│   │   │   │   │   └── recommendations/
│   │   │   │   │
│   │   │   │   ├── ai-coach/
│   │   │   │   │   ├── chat/
│   │   │   │   │   └── coach-history/
│   │   │   │   │
│   │   │   │   ├── knowledge/
│   │   │   │   │   └── knowledge-graph/
│   │   │   │   │
│   │   │   │   ├── github/
│   │   │   │   │   ├── github-import/
│   │   │   │   │   └── repository-analysis/
│   │   │   │   │
│   │   │   │   └── settings/
│   │   │   │
│   │   │   ├── app.routes.ts
│   │   │   └── app.config.ts
│   │   │
│   │   ├── assets/
│   │   │   ├── icons/
│   │   │   └── images/
│   │   │
│   │   └── styles.css
│   │
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
│
├── backend/
│   │
│   ├── app/
│   │   │
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── projects.py
│   │   │   │   ├── skills.py
│   │   │   │   ├── portfolio.py
│   │   │   │   ├── career.py
│   │   │   │   ├── analysis.py
│   │   │   │   ├── optimization.py
│   │   │   │   ├── recommendations.py
│   │   │   │   ├── ai_coach.py
│   │   │   │   └── github.py
│   │   │   └── dependencies.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   ├── skill.py
│   │   │   ├── career_role.py
│   │   │   ├── analysis.py
│   │   │   └── recommendation.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── project_schema.py
│   │   │   ├── skill_schema.py
│   │   │   ├── career_schema.py
│   │   │   ├── analysis_schema.py
│   │   │   └── recommendation_schema.py
│   │   │
│   │   ├── services/
│   │   │   ├── portfolio_service.py
│   │   │   ├── skill_service.py
│   │   │   ├── career_service.py
│   │   │   ├── analysis_service.py
│   │   │   ├── recommendation_service.py
│   │   │   └── github_service.py
│   │   │
│   │   ├── ml/
│   │   │   │
│   │   │   ├── preprocessing/
│   │   │   │   ├── data_cleaning.py
│   │   │   │   └── feature_engineering.py
│   │   │   │
│   │   │   ├── classification/
│   │   │   │   ├── project_classifier.py
│   │   │   │   └── models/
│   │   │   │
│   │   │   ├── clustering/
│   │   │   │   └── skill_cluster.py
│   │   │   │
│   │   │   ├── prediction/
│   │   │   │   └── portfolio_prediction.py
│   │   │   │
│   │   │   ├── evaluation/
│   │   │   │   ├── metrics.py
│   │   │   │   └── evaluate_models.py
│   │   │   │
│   │   │   └── saved_models/
│   │   │       └── .gitkeep
│   │   │
│   │   ├── analytics/
│   │   │   ├── portfolio_scoring.py
│   │   │   ├── skill_gap.py
│   │   │   ├── diversity.py
│   │   │   ├── role_alignment.py
│   │   │   └── similarity.py
│   │   │
│   │   ├── optimization/
│   │   │   ├── portfolio_optimizer.py
│   │   │   ├── objective_functions.py
│   │   │   ├── constraints.py
│   │   │   └── recommendation_optimizer.py
│   │   │
│   │   ├── knowledge/
│   │   │   ├── knowledge_graph.py
│   │   │   ├── entity_extractor.py
│   │   │   ├── retrieval.py
│   │   │   └── data/
│   │   │       ├── career_roles.json
│   │   │       ├── skills.json
│   │   │       ├── technologies.json
│   │   │       └── relationships.json
│   │   │
│   │   ├── ai/
│   │   │   ├── groq_client.py
│   │   │   ├── prompts.py
│   │   │   ├── coach.py
│   │   │   └── response_generator.py
│   │   │
│   │   ├── database/
│   │   │   ├── connection.py
│   │   │   └── repositories/
│   │   │
│   │   └── config/
│   │       └── settings.py
│   │
│   ├── tests/
│   │   ├── test_portfolio.py
│   │   ├── test_analysis.py
│   │   ├── test_ml.py
│   │   ├── test_optimization.py
│   │   └── test_ai.py
│   │
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
│
├── ml/
│   │
│   ├── datasets/
│   │   ├── raw/
│   │   ├── processed/
│   │   └── external/
│   │
│   ├── notebooks/
│   │   ├── data_exploration.ipynb
│   │   ├── project_classification.ipynb
│   │   ├── skill_clustering.ipynb
│   │   └── model_evaluation.ipynb
│   │
│   ├── training/
│   │   ├── train_classifier.py
│   │   ├── train_clusterer.py
│   │   └── evaluate.py
│   │
│   └── models/
│       └── .gitkeep
│
│
├── docs/
│   ├── system-architecture.md
│   ├── api-documentation.md
│   ├── ml-documentation.md
│   ├── optimization.md
│   ├── knowledge-base.md
│   └── ui-ux/
│       ├── wireframes/
│       └── design-specification.md
│
│
├── .gitignore
├── README.md
└── LICENSE
```

---

# 2. File Structure Responsibilities

## Frontend

The `frontend/` directory contains the Angular application.

```text id="3q8h5m"
frontend/
└── src/app/
```

It is responsible for:

* UI
* Navigation
* User interaction
* Charts
* Portfolio forms
* Analysis dashboards
* AI Coach interface

The frontend does **not** directly execute the ML models.

Instead:

```text id="7b7q8b"
Angular
   ↓
FastAPI
   ↓
ML / Analytics / Optimization
   ↓
FastAPI Response
   ↓
Angular UI
```

---

# 3. Backend Architecture

The `backend/` directory contains the main application logic.

```text id="4cgjl6"
backend/app/
│
├── api/
├── services/
├── ml/
├── analytics/
├── optimization/
├── knowledge/
└── ai/
```

Each layer has a specific responsibility.

### API

Handles HTTP requests.

```text
Angular
   ↓
/api/portfolio/analyze
```

### Services

Handles application/business logic.

### ML

Handles machine learning models.

### Analytics

Handles mathematical scoring and portfolio metrics.

### Optimization

Handles portfolio improvement recommendations.

### Knowledge

Handles career/skill/technology relationships.

### AI

Handles Groq/LLM communication.

---

# 4. Machine Learning File Structure

The ML components are separated from the general backend logic.

```text id="0u1b5j"
backend/app/ml/

├── preprocessing/
│   ├── data_cleaning.py
│   └── feature_engineering.py
│
├── classification/
│   └── project_classifier.py
│
├── clustering/
│   └── skill_cluster.py
│
├── prediction/
│   └── portfolio_prediction.py
│
├── evaluation/
│   ├── metrics.py
│   └── evaluate_models.py
│
└── saved_models/
```

This separation makes the ML portion easier to:

* Develop
* Test
* Train
* Evaluate
* Replace
* Deploy

---

# 5. Analytics and Mathematical Layer

The `analytics/` directory contains calculations that do not necessarily require machine learning.

```text id="6lh3je"
analytics/

├── portfolio_scoring.py
├── skill_gap.py
├── diversity.py
├── role_alignment.py
└── similarity.py
```

Examples:

### `portfolio_scoring.py`

Calculates:

```text
Portfolio Health Score
Skill Coverage
Technology Coverage
Project Quality
Recency
```

### `skill_gap.py`

Calculates:

```text
Required Skill - Demonstrated Skill
```

### `diversity.py`

Calculates:

```text
Project Diversity
Technology Diversity
Skill Diversity
```

### `role_alignment.py`

Calculates:

```text
Current Skills
       ↓
Target Role Requirements
       ↓
Alignment Score
```

### `similarity.py`

Calculates similarity between:

* Projects
* Skills
* Technologies
* Career roles

---

# 6. Optimization Layer

The `optimization/` directory handles mathematical optimization.

```text id="1c3xha"
optimization/

├── portfolio_optimizer.py
├── objective_functions.py
├── constraints.py
└── recommendation_optimizer.py
```

### Example

The optimizer attempts to maximize:

```text
Portfolio Alignment
```

while considering constraints such as:

```text
Available Skills
Development Time
Existing Projects
Skill Gaps
Technology Diversity
Target Role
```

This makes the project more mathematically oriented rather than relying entirely on an LLM.

---

# 7. Knowledge Representation Layer

The `knowledge/` directory contains the structured career and technology knowledge.

```text id="j9b5y7"
knowledge/

├── knowledge_graph.py
├── entity_extractor.py
├── retrieval.py
│
└── data/
    ├── career_roles.json
    ├── skills.json
    ├── technologies.json
    └── relationships.json
```

Example relationship:

```json
{
  "role": "AI Engineer",
  "requires": [
    "Python",
    "Machine Learning",
    "Data Processing",
    "MLOps"
  ]
}
```

Another example:

```json
{
  "technology": "FastAPI",
  "related_to": [
    "Python",
    "Backend Development",
    "Machine Learning Deployment"
  ]
}
```

These relationships can be represented internally using **NetworkX**.

---

# 8. AI Layer

The `ai/` directory handles the LLM.

```text id="h4c9l4"
ai/

├── groq_client.py
├── prompts.py
├── coach.py
└── response_generator.py
```

### `groq_client.py`

Handles communication with Groq.

### `prompts.py`

Stores reusable AI prompts.

### `coach.py`

Combines portfolio analysis with the AI Coach.

### `response_generator.py`

Generates structured natural-language responses.

The AI receives analytical information such as:

```text
Portfolio Score: 82
Target Role: AI Engineer

Skill Gaps:
- Docker
- Cloud
- MLOps

Recommendations:
- Improve ML deployment
- Build an MLOps project
```

Then generates an explanation for the user.

---

# 9. ML Training Workspace

The separate `ml/` directory is used for experimentation and model training.

```text id="m20s6y"
ml/

├── datasets/
├── notebooks/
├── training/
└── models/
```

This prevents experimental notebooks and datasets from cluttering the production backend.

### Example workflow

```text id="0f2ypw"
Dataset
   ↓
Jupyter Notebook
   ↓
Experiment
   ↓
Model Training
   ↓
Evaluation
   ↓
Saved Model
   ↓
backend/app/ml/saved_models/
   ↓
FastAPI
```

---

# 10. Recommended MVP File Structure

If the full structure feels too large initially, the MVP can start much smaller:

```text id="4rm1wm"
PortfolioIQ-AI/
│
├── frontend/
│   └── Angular application
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   └── routes/
│   │   │
│   │   ├── services/
│   │   │
│   │   ├── ml/
│   │   │   ├── preprocessing/
│   │   │   ├── classification/
│   │   │   └── clustering/
│   │   │
│   │   ├── analytics/
│   │   │   ├── portfolio_scoring.py
│   │   │   ├── skill_gap.py
│   │   │   └── role_alignment.py
│   │   │
│   │   ├── optimization/
│   │   │   └── portfolio_optimizer.py
│   │   │
│   │   ├── knowledge/
│   │   │   ├── knowledge_graph.py
│   │   │   └── data/
│   │   │
│   │   └── ai/
│   │       ├── groq_client.py
│   │       └── coach.py
│   │
│   └── tests/
│
├── ml/
│   ├── datasets/
│   ├── notebooks/
│   └── training/
│
├── docs/
│
├── README.md
├── .gitignore
└── LICENSE
```

This MVP structure is recommended for the initial development phase.

---

# 11. Recommended Development Order

The system should not be developed in the order of the final file tree. A better development sequence is:

```text id="6x1e3d"
Phase 1
Project + Skill Management
        ↓
Phase 2
Portfolio Health Scoring
        ↓
Phase 3
Career Roles + Skill Gap Analysis
        ↓
Phase 4
ML Project Classification
        ↓
Phase 5
Skill/Technology Clustering
        ↓
Phase 6
Portfolio Optimization
        ↓
Phase 7
Knowledge Representation
        ↓
Phase 8
Groq AI Developer Coach
        ↓
Phase 9
GitHub Integration
        ↓
Phase 10
Advanced UI / Visualization
```

This keeps the system functional throughout development instead of requiring the ML and AI components to be completed before the application can be used.

---

# 12. Final Architecture

```text id="8s7n7q"
                         ┌───────────────────────┐
                         │      ANGULAR UI       │
                         │                       │
                         │ Dashboard             │
                         │ Projects              │
                         │ Skills                │
                         │ Career Analysis       │
                         │ Optimization          │
                         │ AI Coach              │
                         └───────────┬───────────┘
                                     │
                                  REST API
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │       FASTAPI         │
                         │                       │
                         │ API Routes            │
                         │ Services              │
                         └───────────┬───────────┘
                                     │
             ┌───────────────────────┼────────────────────────┐
             │                       │                        │
             ▼                       ▼                        ▼
     ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
     │ ML ENGINE     │       │ ANALYTICS     │       │ OPTIMIZATION  │
     │               │       │               │       │               │
     │ Random Forest │       │ Scoring       │       │ SciPy         │
     │ XGBoost       │       │ Skill Gap     │       │ CVXPY*        │
     │ K-Means       │       │ Diversity     │       │ Constraints   │
     └───────┬───────┘       └───────┬───────┘       └───────┬───────┘
             │                       │                        │
             └───────────────────────┼────────────────────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │ KNOWLEDGE LAYER       │
                         │                       │
                         │ NetworkX              │
                         │ Career Roles          │
                         │ Skills                │
                         │ Technologies          │
                         │ Relationships         │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │      GROQ + LLM       │
                         │                       │
                         │ AI Developer Coach    │
                         │ Explanations          │
                         │ Recommendations       │
                         └───────────────────────┘

                         ┌───────────────────────┐
                         │      DATABASE         │
                         │                       │
                         │ Supabase PostgreSQL   │
                         └───────────────────────┘

                         ┌───────────────────────┐
                         │    EXTERNAL DATA      │
                         │                       │
                         │ GitHub API            │
                         └───────────────────────┘
```

---

# 13. Summary

PortfolioIQ AI consists of five major intelligence layers:

```text id="f6ny2r"
1. DATA
   Projects + Skills + Technologies + GitHub

              ↓

2. MACHINE LEARNING
   Classification + Clustering

              ↓

3. MATHEMATICAL ANALYSIS
   Scoring + Similarity + Skill Gap

              ↓

4. OPTIMIZATION
   Portfolio Improvement + Project Selection

              ↓

5. GENERATIVE AI
   Groq + LLM + KAG
   ↓
   Personalized Developer Coaching
```

This architecture gives PortfolioIQ AI a clear identity as a **software development + machine learning + mathematics project**, rather than simply being another AI chatbot or portfolio website.
