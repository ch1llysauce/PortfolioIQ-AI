"""
Portfolio Optimizer Engine.
Implements multi-objective constraint optimization (0/1 Knapsack formulation)
to recommend the optimal portfolio enhancement projects and learning path.
"""
from typing import List, Dict, Any, Optional
from app.optimization.objective_functions import (
    calculate_skill_gap_gain,
    calculate_role_domain_alignment,
    calculate_diversity_bonus,
    calculate_effort_efficiency
)
from app.optimization.constraints import OptimizationConstraints
from app.knowledge.knowledge_graph import ROLE_PROFILES

# Curated Project Archetype Catalog representing modern industry portfolio projects
PROJECT_CATALOG: List[Dict[str, Any]] = [
    # --- SPRINT TIER ARCHETYPES (~18-20 Hours) ---
    {
        "id": "proj-sprint-uiux-tokens",
        "title": "Figma Interactive Design Tokens & Accessible UI Kit",
        "domain": "UI/UX Design",
        "difficulty": "Sprint (Foundational)",
        "estimated_hours": 18,
        "skills": ["Figma", "Design Systems", "UI/UX Design", "Wireframing & Prototyping", "Tailwind CSS"],
        "description": "Rapid-turnaround design token system and responsive UI component kit designed for quick developer handoff and pixel-perfect consistency.",
        "architecture_highlights": "Figma design tokens, typography scales, atomic UI components, responsive layout grids."
    },
    {
        "id": "proj-sprint-frontend-widgets",
        "title": "Modular UI Component Library & Responsive Dashboard Widgets",
        "domain": "Frontend Development",
        "difficulty": "Sprint (Foundational)",
        "estimated_hours": 18,
        "skills": ["TypeScript", "Angular", "HTML/CSS", "Tailwind CSS", "Responsive Web Design"],
        "description": "Clean, modular standalone component library with reactive signals, theme switching, and responsive viewport support.",
        "architecture_highlights": "Standalone Angular components, signals state, Tailwind CSS styling, accessibility attributes."
    },
    {
        "id": "proj-sprint-backend-microapi",
        "title": "FastAPI High-Speed Micro-Service & Auth API Gateway",
        "domain": "Backend Development",
        "difficulty": "Sprint (Foundational)",
        "estimated_hours": 18,
        "skills": ["Python", "FastAPI", "PostgreSQL", "REST API", "Docker"],
        "description": "Lightweight, high-performance REST microservice with JWT authentication, CRUD endpoints, and auto-generated Swagger OpenAPI schema.",
        "architecture_highlights": "Async FastAPI routes, Pydantic validation, JWT tokens, Docker container wrapper."
    },
    {
        "id": "proj-sprint-ai-embed-search",
        "title": "Semantic Vector Search & Embeddings Query Tool",
        "domain": "AI / ML",
        "difficulty": "Sprint (Foundational)",
        "estimated_hours": 20,
        "skills": ["Python", "FastAPI", "Vector Databases", "LangChain"],
        "description": "Focused semantic search tool that embeds text documents and returns nearest-neighbor similarity matches in real time.",
        "architecture_highlights": "Dense vector embeddings, cosine similarity search, lightweight FastAPI endpoint."
    },
    {
        "id": "proj-sprint-devops-ci",
        "title": "Automated GitHub Actions CI/CD Pipeline & Container Gate",
        "domain": "DevOps",
        "difficulty": "Sprint (Foundational)",
        "estimated_hours": 18,
        "skills": ["Docker", "CI/CD", "GitHub Actions", "Linux"],
        "description": "Automated CI/CD workflow that executes unit tests, performs lint checks, builds Docker images, and publishes release artifacts.",
        "architecture_highlights": "GitHub Actions multi-job workflow, Docker layer caching, automated status checks."
    },

    # --- STANDARD & COMPREHENSIVE TIER ARCHETYPES (~30-45 Hours) ---
    # UI / UX Design Archetypes
    {
        "id": "proj-uiux-design-system",
        "title": "Accessible Design System & Interactive UI Component Library",
        "domain": "UI/UX Design",
        "difficulty": "Intermediate",
        "estimated_hours": 30,
        "skills": ["Figma", "Design Systems", "UI/UX Design", "Wireframing & Prototyping", "HTML/CSS", "Tailwind CSS", "Responsive Web Design"],
        "description": "Scalable multi-brand design system with Figma token integration, accessible WCAG 2.1 AA UI components, and interactive prototypes.",
        "architecture_highlights": "Design tokens, atomic design hierarchy, responsive Tailwind CSS layouts, interactive variant states, Figma-to-code pipeline."
    },
    {
        "id": "proj-ux-research-prototype",
        "title": "End-to-End User Experience Case Study & Interactive Prototype",
        "domain": "UI/UX Design",
        "difficulty": "Intermediate",
        "estimated_hours": 35,
        "skills": ["Figma", "UI/UX Design", "User Research", "Wireframing & Prototyping", "HTML/CSS", "Responsive Web Design"],
        "description": "Comprehensive UX case study featuring user journey mapping, persona research, wireframing, high-fidelity Figma prototyping, and usability testing.",
        "architecture_highlights": "Information architecture, user flows, heuristic evaluation, interactive micro-animations, clickable Figma prototype."
    },

    # Frontend Development Archetypes
    {
        "id": "proj-frontend-ecommerce-spa",
        "title": "High-Performance E-Commerce SPA with Instant State Filtering",
        "domain": "Frontend Development",
        "difficulty": "Intermediate",
        "estimated_hours": 30,
        "skills": ["TypeScript", "Angular", "HTML/CSS", "Tailwind CSS", "Responsive Web Design", "REST API", "Git"],
        "description": "Modern single-page application featuring instant client-side search filtering, cart state management, responsive dark mode, and seamless REST API checkout integration.",
        "architecture_highlights": "Standalone Angular components, signals reactive state, Tailwind CSS utility styling, responsive viewport breakpoints."
    },

    # Full-Stack Development Archetypes
    {
        "id": "proj-fullstack-saas",
        "title": "Multi-Tenant Cloud Analytics SaaS Platform",
        "domain": "Web Development",
        "difficulty": "Advanced",
        "estimated_hours": 45,
        "skills": ["TypeScript", "Angular", "Node.js", "PostgreSQL", "Docker", "REST API", "HTML/CSS"],
        "description": "Full-stack platform with secure user authentication, role-based access control, relational database schema, and live analytical metric charts.",
        "architecture_highlights": "Clean architecture, JWT authentication, responsive Angular standalone components, relational data modeling."
    },

    # Backend Development Archetypes
    {
        "id": "proj-highperf-backend-api",
        "title": "High-Throughput Distributed Cache & Asynchronous Worker API",
        "domain": "Backend Development",
        "difficulty": "Intermediate",
        "estimated_hours": 25,
        "skills": ["Python", "FastAPI", "Redis", "PostgreSQL", "Docker", "REST API", "Microservices"],
        "description": "Backend API capable of handling heavy concurrent traffic using asynchronous job queues, Redis caching, rate-limiting, and relational persistence.",
        "architecture_highlights": "Async/await I/O, cache invalidation strategies, database connection pooling, OpenAPI Swagger documentation."
    },

    # AI / ML & GenAI Archetypes
    {
        "id": "proj-rag-ai-assistant",
        "title": "RAG Knowledge Base & Conversational Multi-Agent AI",
        "domain": "AI / ML",
        "difficulty": "Intermediate",
        "estimated_hours": 30,
        "skills": ["Python", "FastAPI", "LangChain", "Vector Databases", "Retrieval-Augmented Generation (RAG)", "PyTorch"],
        "description": "Retrieval-Augmented Generation (RAG) assistant that indexes developer documentation into vector embeddings and answers queries with real-time citations.",
        "architecture_highlights": "Vector search similarity, semantic chunking, prompt engineering, async FastAPI backend."
    },
    {
        "id": "proj-mlops-pipeline",
        "title": "Automated MLOps Training & Model Registry Pipeline",
        "domain": "AI / ML",
        "difficulty": "Advanced",
        "estimated_hours": 35,
        "skills": ["Python", "Docker", "MLOps", "Scikit-Learn", "FastAPI", "GitHub Actions", "Machine Learning"],
        "description": "Production-grade CI/CD pipeline that automatically trains, evaluates, packages, and deploys a machine learning model as a containerized REST microservice.",
        "architecture_highlights": "Docker containerization, automated testing with GitHub Actions, REST API serving via FastAPI, model versioning."
    },
    {
        "id": "proj-deep-learning-cv",
        "title": "Computer Vision Edge Inference System",
        "domain": "AI / ML",
        "difficulty": "Advanced",
        "estimated_hours": 40,
        "skills": ["Python", "PyTorch", "Deep Learning", "Docker", "Machine Learning"],
        "description": "Custom convolutional neural network trained for real-time object detection and segmentation, optimized for edge device inference.",
        "architecture_highlights": "Transfer learning, model quantization, data augmentation pipeline, real-time webcam feed processing."
    },

    # Data Science & Analytics Archetypes
    {
        "id": "proj-predictive-analytics-bi",
        "title": "Automated Predictive Analytics & Executive BI Dashboard",
        "domain": "Data Science",
        "difficulty": "Intermediate",
        "estimated_hours": 35,
        "skills": ["Python", "Pandas", "NumPy", "Scikit-Learn", "SQL", "Data Visualization", "Machine Learning"],
        "description": "Statistical modeling and exploratory data analysis pipeline that transforms raw datasets into executive KPI dashboards with automated forecasting.",
        "architecture_highlights": "Hypothesis testing, feature engineering, regression modeling, interactive chart visualization."
    },

    # Data Engineering Archetypes
    {
        "id": "proj-data-streaming-etl",
        "title": "Real-Time Distributed Data Streaming & ETL Pipeline",
        "domain": "Data Engineering",
        "difficulty": "Advanced",
        "estimated_hours": 40,
        "skills": ["Python", "SQL", "PostgreSQL", "Docker", "ETL Pipelines", "Pandas"],
        "description": "End-to-end data pipeline processing streaming transactions, performing statistical anomaly detection, and warehousing aggregated metrics into SQL.",
        "architecture_highlights": "Data cleansing, batch/stream transformation with Pandas, relational indexing, automated visualization charts."
    },

    # DevOps & Cloud Infrastructure Archetypes
    {
        "id": "proj-cloud-microservices-k8s",
        "title": "Cloud-Native Microservices with Container Orchestration",
        "domain": "DevOps",
        "difficulty": "Advanced",
        "estimated_hours": 35,
        "skills": ["Docker", "Kubernetes", "CI/CD", "Linux", "Terraform", "Cloud Computing"],
        "description": "Decoupled microservice architecture with service discovery, health probes, automated horizontal scaling, and zero-downtime deployment rolling updates.",
        "architecture_highlights": "Docker multistage builds, Kubernetes manifest deployments, ingress routing, distributed logging."
    },

    # Mobile Development Archetypes
    {
        "id": "proj-crossplatform-mobile",
        "title": "Real-Time Mobile Productivity & Sync App",
        "domain": "Mobile Development",
        "difficulty": "Intermediate",
        "estimated_hours": 30,
        "skills": ["Flutter", "TypeScript", "REST API", "Firebase", "Responsive Web Design"],
        "description": "Cross-platform mobile application featuring offline-first local storage, real-time database synchronization, push notifications, and biometric auth.",
        "architecture_highlights": "State management, optimistic UI updates, background synchronization, responsive native UI."
    },

    # QA & Quality Engineering Archetypes
    {
        "id": "proj-qa-automation-suite",
        "title": "Automated End-to-End Test Automation Framework & Quality Gates",
        "domain": "Quality Engineering",
        "difficulty": "Intermediate",
        "estimated_hours": 25,
        "skills": ["Automated Testing", "Postman", "Python", "CI/CD", "Git", "REST API"],
        "description": "Comprehensive test automation framework supporting API regression testing, parallel UI execution, and automated CI/CD pipeline quality gates.",
        "architecture_highlights": "Page object model, parameterized test execution, automated test reports, webhook notifications."
    },

    # Cybersecurity Archetypes
    {
        "id": "proj-cybersecurity-pipeline",
        "title": "Zero-Trust Infrastructure & Automated Vulnerability Scanning Suite",
        "domain": "Cybersecurity",
        "difficulty": "Advanced",
        "estimated_hours": 35,
        "skills": ["Cybersecurity", "Vulnerability Assessment", "Linux", "Docker", "Cloud Computing", "CI/CD"],
        "description": "Automated security testing and compliance pipeline with container image scanning, secret detection, SAST/DAST analysis, and cloud hardening.",
        "architecture_highlights": "Zero-trust IAM policy, automated SAST scan in GitHub Actions, container vulnerability auditing."
    },

    # System Architecture Archetypes
    {
        "id": "proj-system-design-microservices",
        "title": "High-Scale Event-Driven Distributed Microservices Architecture",
        "domain": "Software Architecture",
        "difficulty": "Advanced",
        "estimated_hours": 40,
        "skills": ["System Design", "Microservices", "PostgreSQL", "Redis", "Cloud Computing", "Docker", "REST API"],
        "description": "Fault-tolerant distributed system with message queues, eventual consistency, database sharding, and high-availability service topologies.",
        "architecture_highlights": "Event-driven architecture, distributed transactions, circuit breakers, load balancing."
    }
]

def optimize_portfolio_recommendations(
    user_skills: List[str],
    missing_skills: List[str],
    target_role: str,
    existing_projects: List[Dict[str, Any]],
    matching_skills: Optional[List[str]] = None,
    effort_budget_hours: int = 80,
    max_projects_count: int = 2
) -> Dict[str, Any]:
    """
    Executes multi-objective constraint optimization to select candidate projects
    that maximize skill gap coverage, role alignment, and ROI while strictly honoring effort constraints.
    """
    constraints = OptimizationConstraints(
        max_effort_hours=effort_budget_hours,
        max_projects_count=max_projects_count
    )

    user_skills_clean = [s.strip() for s in user_skills if s]
    missing_skills_clean = [s.strip() for s in missing_skills if s]
    matching_skills_clean = [s.strip() for s in (matching_skills or []) if s]

    user_skills_lower = {s.lower() for s in user_skills_clean}
    missing_skills_lower = {s.lower() for s in missing_skills_clean}

    # If matching_skills is not explicitly supplied, attempt to derive from role profile
    if not matching_skills_clean and target_role in ROLE_PROFILES:
        role_prereqs = ROLE_PROFILES[target_role].get("prereqs", [])
        matching_skills_clean = [r for r in role_prereqs if r.lower() in user_skills_lower]
        if not missing_skills_clean:
            missing_skills_clean = [r for r in role_prereqs if r.lower() not in user_skills_lower]
            missing_skills_lower = {s.lower() for s in missing_skills_clean}

    # Extract existing project domains
    existing_domains = [p.get("domain", "") or p.get("category", "") for p in existing_projects]

    scored_candidates = []

    for archetype in PROJECT_CATALOG:
        proj_skills = archetype["skills"]
        hours = archetype["estimated_hours"]
        domain = archetype["domain"]

        # Calculate skills this project will teach that address missing gaps
        covered_gaps = [s for s in proj_skills if s.lower() in missing_skills_lower]
        new_skills = [s for s in proj_skills if s.lower() not in user_skills_lower]

        # Objective Function Calculations
        gap_gain = calculate_skill_gap_gain(proj_skills, missing_skills_clean, user_skills_clean, target_role)
        role_alignment = calculate_role_domain_alignment(domain, target_role, len(covered_gaps))
        diversity_bonus = calculate_diversity_bonus(domain, existing_domains)

        # Total Utility Score
        total_utility = gap_gain + role_alignment + diversity_bonus
        efficiency = calculate_effort_efficiency(total_utility, hours)

        scored_candidates.append({
            **archetype,
            "gap_gain": gap_gain,
            "role_alignment": role_alignment,
            "diversity_bonus": diversity_bonus,
            "total_utility": round(total_utility, 2),
            "efficiency_score": efficiency,
            "covered_gaps": covered_gaps,
            "new_skills": new_skills
        })

    # Sort candidates by total utility descending, then efficiency
    scored_candidates.sort(key=lambda x: (x["total_utility"], x["efficiency_score"]), reverse=True)

    # 0/1 Knapsack Selection under effort constraint
    selected_projects = []
    accumulated_hours = 0
    newly_acquired_skills = set()

    for candidate in scored_candidates:
        if not constraints.is_within_count(len(selected_projects)):
            break
        if constraints.is_within_effort(accumulated_hours, candidate["estimated_hours"]):
            selected_projects.append(candidate)
            accumulated_hours += candidate["estimated_hours"]
            for s in candidate["skills"]:
                newly_acquired_skills.add(s)

    # If constraint was too strict to pick any, pick the single highest efficiency project
    if not selected_projects and scored_candidates:
        top_single = max(scored_candidates, key=lambda x: x["efficiency_score"])
        selected_projects.append(top_single)
        accumulated_hours = top_single["estimated_hours"]
        for s in top_single["skills"]:
            newly_acquired_skills.add(s)

    # Calculate Projected Improvements accurately based on role requirements
    total_role_skills_count = len(matching_skills_clean) + len(missing_skills_clean)
    if total_role_skills_count == 0:
        total_role_skills_count = max(1, len(user_skills_clean))
        current_matched_count = len(user_skills_clean)
    else:
        current_matched_count = len(matching_skills_clean)

    current_match_pct = round((current_matched_count / total_role_skills_count) * 100, 1)

    # Skills after completing selected projects
    newly_acquired_lower = {s.lower() for s in newly_acquired_skills}
    covered_gaps_count = len([s for s in missing_skills_clean if s.lower() in newly_acquired_lower])
    projected_matched_count = min(total_role_skills_count, current_matched_count + covered_gaps_count)
    projected_match_pct = round((projected_matched_count / total_role_skills_count) * 100, 1)

    # Health score projection
    projected_health_increase = min(25, len(selected_projects) * 8 + len(newly_acquired_skills) * 2)

    # Optimal Skill Learning Path (Order skills by urgency: missing skills first, then supporting)
    priority_skills = []
    for proj in selected_projects:
        for skill in proj["covered_gaps"]:
            if skill not in priority_skills:
                priority_skills.append(skill)
    for proj in selected_projects:
        for skill in proj["new_skills"]:
            if skill not in priority_skills:
                priority_skills.append(skill)

    return {
        "target_role": target_role or "General Developer",
        "effort_budget_hours": effort_budget_hours,
        "allocated_effort_hours": accumulated_hours,
        "recommended_projects": selected_projects,
        "optimal_skill_path": priority_skills,
        "impact_simulation": {
            "current_match_percentage": current_match_pct,
            "projected_match_percentage": min(100.0, projected_match_pct),
            "match_increase": round(min(100.0, projected_match_pct) - current_match_pct, 1),
            "projected_health_gain": projected_health_increase
        }
    }
