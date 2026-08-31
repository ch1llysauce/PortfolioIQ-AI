# PortfolioIQ AI — Initial Development Setup

## 1. Development Approach

PortfolioIQ AI is a relatively large system combining:

* Software development
* Data processing
* Machine learning
* Mathematical analytics
* Optimization
* Knowledge representation
* Generative AI

Because of this, the system should be developed **incrementally** instead of creating the entire architecture immediately.

The recommended development flow is:

```text
Stage 1
Project Initialization
        ↓
Stage 2
Angular + FastAPI Setup
        ↓
Stage 3
Angular + FastAPI Connection
        ↓
Stage 4
Database + Authentication
        ↓
Stage 5
Project + Skill Management
        ↓
Stage 6
Portfolio Analytics
        ↓
Stage 7
Career Alignment
        ↓
Stage 8
Machine Learning
        ↓
Stage 9
Portfolio Optimization
        ↓
Stage 10
Knowledge Representation
        ↓
Stage 11
Groq AI Coach
        ↓
Stage 12
GitHub + Advanced Features
```

---

# 2. Stage 1 — Project Initialization

The first step is to create the main repository structure.

At this stage, do **not** create every future module yet.

Initial structure:

```text
PortfolioIQ-AI/
│
├── frontend/
├── backend/
├── ml/
├── docs/
├── README.md
└── .gitignore
```

Initialize Git:

```bash
mkdir PortfolioIQ-AI
cd PortfolioIQ-AI

git init
```

Create the main directories:

```bash
mkdir frontend backend ml docs
```

---

# 3. Stage 2 — Angular Frontend Setup

PortfolioIQ AI will use Angular with TypeScript for the web application.

## Create the Angular Application

Inside the `frontend` directory:

```bash
cd frontend
ng new portfolioiq-frontend
```

Recommended configuration:

```text
Routing: Yes
Stylesheet: CSS
SSR/SSG: No
```

Then run the development server:

```bash
cd portfolioiq-frontend
ng serve
```

The application should be accessible at:

```text
http://localhost:4200
```

## Initial Frontend Structure

At this stage, keep the structure simple:

```text
frontend/
└── portfolioiq-frontend/
    │
    ├── src/
    ├── angular.json
    ├── package.json
    └── tsconfig.json
```

Do not create all PortfolioIQ feature modules yet.

---

# 4. Stage 3 — FastAPI Backend Setup

The backend will use Python and FastAPI.

Navigate to the backend directory:

```bash
cd PortfolioIQ-AI/backend
```

## Create Virtual Environment

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install the initial dependencies:

```bash
pip install fastapi uvicorn
```

Create the initial backend structure:

```text
backend/
│
├── venv/
│
├── app/
│   ├── __init__.py
│   └── main.py
│
└── requirements.txt
```

Run the FastAPI server:

```bash
uvicorn app.main:app --reload
```

The backend should be accessible at:

```text
http://127.0.0.1:8000
```

FastAPI automatically provides API documentation at:

```text
http://127.0.0.1:8000/docs
```

---

# 5. Stage 4 — Connect Angular and FastAPI

Before implementing machine learning or AI, verify that the frontend and backend can communicate.

The basic architecture should be:

```text
Angular
   │
   │ HTTP Request
   ▼
FastAPI
   │
   ▼
API Response
   │
   ▼
Angular
```

For example:

```text
Angular
   │
   │ GET /api/health
   ▼
FastAPI
   │
   ▼
{
    "status": "ok"
}
```

The first goal is simply to verify:

* Angular can send HTTP requests
* FastAPI can receive requests
* FastAPI can return JSON
* Angular can display the response

A simple **Backend Connection** test can be the first working feature.

---

# 6. Stage 5 — Database and Authentication

After the Angular and FastAPI connection works, add the database.

Recommended database:

```text
Supabase PostgreSQL
```

Initial entities should be kept simple.

```text
users
projects
skills
project_skills
career_roles
role_skills
```

Basic relationship:

```text
USER
 │
 ├── PROJECTS
 │      │
 │      └── PROJECT_SKILLS
 │
 └── SKILLS


CAREER ROLE
 │
 └── ROLE_SKILLS
```

Do not create database tables for every future feature yet.

Only add tables when the corresponding feature is implemented.

---

# 7. Stage 6 — Project Management

The first major PortfolioIQ feature should be **Project Management**.

Users should be able to:

* Create projects
* View projects
* Edit projects
* Delete projects
* Add descriptions
* Add technologies
* Associate skills
* Set project status

## Angular Structure

Eventually:

```text
projects/
│
├── project-list/
├── project-form/
└── project-details/
```

## FastAPI Structure

Eventually:

```text
api/
└── routes/
    └── projects.py

services/
└── project_service.py

schemas/
└── project_schema.py
```

The first complete CRUD workflow should be:

```text
Create Project
      ↓
Read Project
      ↓
Update Project
      ↓
Delete Project
```

---

# 8. Stage 7 — Skill Management

After project management is working, implement skill management.

Example skills:

```text
Python
Java
C++
TypeScript
Angular
React
FastAPI
MongoDB
PostgreSQL
Machine Learning
```

Users should be able to associate skills with projects.

Example:

```text
MathMentor AI
│
├── Python
├── Machine Learning
├── FastAPI
├── React Native
└── MongoDB
```

This structured information becomes the foundation for the future analytics and ML components.

---

# 9. Stage 8 — Portfolio Analytics

Machine learning should **not** be implemented immediately.

First implement deterministic analytics and mathematical calculations.

Create:

```text
analytics/
│
├── portfolio_scoring.py
├── skill_gap.py
├── diversity.py
├── role_alignment.py
└── similarity.py
```

## Portfolio Scoring

The system can calculate a portfolio health score using several factors:

```text
Portfolio Health
    =
    Skill Coverage
    +
    Project Diversity
    +
    Technology Diversity
    +
    Role Alignment
    +
    Project Recency
```

The values can be normalized and weighted.

Example dashboard:

```text
Portfolio Health: 78/100

Skill Coverage:        85
Project Diversity:     72
Technology Diversity:  80
Role Alignment:        75
```

The exact scoring formula can be refined during development.

---

# 10. Stage 9 — Career Alignment

Create a structured career-role knowledge base.

Initially, only use a limited number of roles.

Example:

```text
Software Engineer
Frontend Developer
Backend Developer
Full-Stack Developer
Mobile Developer
AI Engineer
Machine Learning Engineer
Data Scientist
Data Engineer
```

Each role can have associated skills.

Example:

```text
AI Engineer
│
├── Python
├── Machine Learning
├── Data Processing
├── APIs
├── Model Deployment
└── MLOps
```

The system can then calculate:

```text
Current Skills
      ↓
Target Career Role
      ↓
Required Skills
      ↓
Skill Gap
      ↓
Recommendations
```

Example:

```text
Target Role:
AI Engineer

Current Skills:
Python
Machine Learning
FastAPI

Skill Gaps:
Docker
Cloud
MLOps
```

This feature does not require generative AI.

---

# 11. Stage 10 — Machine Learning

Only after enough structured data and analytics are available should the ML components be introduced.

## Project Classification

The first ML component can classify projects.

Workflow:

```text
Project Description
        ↓
Feature Extraction
        ↓
ML Model
        ↓
Project Category
```

Example:

```text
MathMentor AI
      ↓
AI / Machine Learning
Probability: 0.91
```

A good starting algorithm is:

```text
Random Forest
```

Later, other algorithms can be evaluated:

```text
Random Forest
      ↓
XGBoost
      ↓
Performance Comparison
```

## Skill Clustering

Another possible ML component is skill clustering.

```text
Skills
   ↓
Feature Representation
   ↓
K-Means
   ↓
Skill Clusters
```

This can identify groups of related technologies or skills.

---

# 12. Stage 11 — Portfolio Optimization

Once the system has:

* Portfolio scores
* Skills
* Skill gaps
* Career roles
* Project information
* ML results

the optimization layer can be implemented.

Structure:

```text
optimization/
│
├── portfolio_optimizer.py
├── objective_functions.py
├── constraints.py
└── recommendation_optimizer.py
```

The optimizer can attempt to improve portfolio alignment while considering constraints such as:

```text
Available Skills
Development Time
Existing Projects
Skill Gaps
Technology Diversity
Target Career Role
```

Example:

```text
Target:
AI Engineer

Current Gaps:
Docker
Cloud
MLOps

Existing Projects:
12

Optimizer
     ↓
Recommended Next Project
     ↓
ML Deployment Project
```

This component gives PortfolioIQ AI a stronger mathematical and optimization component.

---

# 13. Stage 12 — Knowledge Representation

After the core analytics and ML components are working, introduce the knowledge representation layer.

Initial structure:

```text
knowledge/
│
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

The initial knowledge base does not require a dedicated graph database.

A graph can initially be represented using:

```text
NetworkX
```

Example:

```text
AI Engineer
     │
     ├── Python
     │
     ├── Machine Learning
     │       │
     │       ├── Scikit-learn
     │       └── XGBoost
     │
     └── MLOps
             │
             ├── Docker
             └── Cloud
```

This provides structured relationships between:

* Career roles
* Skills
* Technologies
* Projects

---

# 14. Stage 13 — Groq AI Integration

Groq should be added **after** the analytical system is working.

The LLM should not be responsible for calculating everything.

Instead:

```text
                 Portfolio Data
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Analytics        ML       Optimization
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
                Structured Results
                       │
                       ▼
                    Groq LLM
                       │
                       ▼
              Natural-Language Explanation
```

For example, the backend calculates:

```json
{
    "portfolio_score": 78,
    "target_role": "AI Engineer",
    "skill_gaps": [
        "Docker",
        "Cloud",
        "MLOps"
    ],
    "recommendation": "Build an ML deployment project"
}
```

Groq then converts those results into an understandable explanation.

Example:

> Your portfolio has a strong foundation in machine learning, but you have limited evidence of deployment and MLOps experience. Consider building an ML deployment project using Docker and a cloud platform.

This makes the LLM an **explanation and coaching layer**, rather than the system's sole intelligence.

---

# 15. Stage 14 — GitHub Integration

GitHub integration should be added after the core PortfolioIQ functionality is stable.

Possible workflow:

```text
GitHub Repository
        ↓
Repository Data
        ↓
Project Information
        ↓
Technology Detection
        ↓
Skill Extraction
        ↓
Portfolio Analysis
```

Potential information:

* Repository name
* Programming languages
* Technologies
* Commit activity
* Repository description
* Project structure

GitHub integration should initially be read-only.

---

# 16. Initial Development File Structure

During the earliest development stages, keep the repository small.

```text
PortfolioIQ-AI/
│
├── frontend/
│   └── portfolioiq-frontend/
│
├── backend/
│   ├── venv/
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py
│   │
│   └── requirements.txt
│
├── ml/
│
├── docs/
│
├── .gitignore
└── README.md
```

Do not immediately create:

```text
optimization/
knowledge/
ai/
classification/
clustering/
```

Create those directories when the corresponding functionality is actually being developed.

---

# 17. Final Development Architecture

Once the system is fully developed, the architecture should evolve into:

```text
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
     │ Classification│       │ Scoring       │       │ Optimization  │
     │ Clustering    │       │ Skill Gap     │       │ Constraints   │
     │ Prediction    │       │ Similarity    │       │ Objectives    │
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
                         │       GROQ LLM        │
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

# 18. Recommended Development Order

The recommended implementation order is:

```text
1. Repository Setup
        ↓
2. Angular Setup
        ↓
3. FastAPI Setup
        ↓
4. Angular ↔ FastAPI Connection
        ↓
5. Database
        ↓
6. Authentication
        ↓
7. Project CRUD
        ↓
8. Skill Management
        ↓
9. Portfolio Analytics
        ↓
10. Career Alignment
        ↓
11. ML Classification
        ↓
12. ML Clustering
        ↓
13. Portfolio Optimization
        ↓
14. Knowledge Representation
        ↓
15. Groq AI Coach
        ↓
16. GitHub Integration
        ↓
17. Advanced UI / Visualization
```

---

# 19. Git Commit Milestones

To maintain a clean development history, commit after every major milestone.

```text
1. Initialize PortfolioIQ AI
2. Setup Angular frontend
3. Setup FastAPI backend
4. Connect Angular to FastAPI
5. Add Supabase database
6. Implement authentication
7. Implement project management
8. Implement skill management
9. Implement portfolio analytics
10. Implement career alignment
11. Add ML project classification
12. Add skill clustering
13. Implement portfolio optimization
14. Add knowledge representation
15. Integrate Groq AI Coach
16. Add GitHub integration
17. Improve dashboard and visualizations
```

This also makes the GitHub repository demonstrate the project's evolution from:

```text
Software Engineering
        ↓
Backend Development
        ↓
Database Management
        ↓
Data Processing
        ↓
Mathematical Analytics
        ↓
Machine Learning
        ↓
Optimization
        ↓
Knowledge Representation
        ↓
Generative AI
```

---

# 20. Immediate First Goal

Do **not** start by implementing ML, optimization, or Groq.

The immediate goal is simply:

```text
┌──────────────────────────┐
│ Angular                  │
│ localhost:4200           │
└────────────┬─────────────┘
             │
             │ HTTP
             ▼
┌──────────────────────────┐
│ FastAPI                  │
│ localhost:8000           │
└──────────────────────────┘
```

Once this works, the next goal is:

```text
Angular
   ↓
FastAPI
   ↓
Supabase
   ↓
Projects + Skills
```

Then:

```text
Projects + Skills
       ↓
Portfolio Analytics
       ↓
ML
       ↓
Optimization
       ↓
Knowledge Representation
       ↓
Groq AI Coach
```

This approach keeps the project manageable while still allowing the final system to become a substantial **AI + ML + mathematics + software engineering portfolio project**.
