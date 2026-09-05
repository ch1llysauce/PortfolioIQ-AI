"""
Portfolio Optimizer Engine.
Implements constraint-based optimization (0/1 Knapsack formulation)
to recommend the optimal portfolio enhancement projects and learning path.
"""
from typing import List, Dict, Any, Optional
from app.optimization.objective_functions import (
    calculate_skill_gap_gain,
    calculate_diversity_bonus,
    calculate_effort_efficiency
)
from app.optimization.constraints import OptimizationConstraints

# Curated Project Archetype Catalog representing modern industry portfolio projects
PROJECT_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "proj-mlops-pipeline",
        "title": "Automated MLOps Training & Deployment Pipeline",
        "domain": "AI / ML",
        "difficulty": "Advanced",
        "estimated_hours": 35,
        "skills": ["Python", "Docker", "MLOps", "Scikit-Learn", "FastAPI", "GitHub Actions"],
        "description": "Production-grade CI/CD pipeline that automatically trains, evaluates, packages, and deploys a machine learning model as a containerized REST microservice.",
        "architecture_highlights": "Docker containerization, automated testing with GitHub Actions, REST API serving via FastAPI, model versioning."
    },
    {
        "id": "proj-rag-ai-assistant",
        "title": "RAG Knowledge Base & Conversational AI Agent",
        "domain": "AI / ML",
        "difficulty": "Intermediate",
        "estimated_hours": 30,
        "skills": ["Python", "FastAPI", "LangChain", "Vector Database", "PyTorch", "Tailwind CSS"],
        "description": "Retrieval-Augmented Generation (RAG) assistant that indexes developer documentation into vector embeddings and answers queries with real-time citations.",
        "architecture_highlights": "Vector search similarity, semantic chunking, prompt engineering, async FastAPI backend."
    },
    {
        "id": "proj-fullstack-saas",
        "title": "Multi-Tenant Cloud Analytics SaaS Dashboard",
        "domain": "Web Development",
        "difficulty": "Advanced",
        "estimated_hours": 45,
        "skills": ["TypeScript", "Angular", "Node.js", "PostgreSQL", "Docker", "REST API"],
        "description": "Full-stack dashboard with secure user authentication, role-based access control, relational database schema, and live analytical metric charts.",
        "architecture_highlights": "Clean architecture, JWT authentication, responsive Angular standalone components, relational data modeling."
    },
    {
        "id": "proj-data-streaming-etl",
        "title": "Real-Time Distributed Data Streaming & ETL Pipeline",
        "domain": "Data Science",
        "difficulty": "Advanced",
        "estimated_hours": 40,
        "skills": ["Python", "Pandas", "SQL", "Docker", "PostgreSQL", "Data Visualization"],
        "description": "End-to-end data pipeline processing streaming transactions, performing statistical anomaly detection, and warehousing aggregated metrics into SQL.",
        "architecture_highlights": "Data cleansing, batch/stream transformation with Pandas, relational indexing, automated visualization charts."
    },
    {
        "id": "proj-cloud-microservices-k8s",
        "title": "Cloud-Native Microservices with Container Orchestration",
        "domain": "DevOps",
        "difficulty": "Advanced",
        "estimated_hours": 35,
        "skills": ["Docker", "Kubernetes", "CI/CD", "Linux", "Go", "Cloud"],
        "description": "Decoupled microservice architecture with service discovery, health probes, automated horizontal scaling, and zero-downtime deployment rolling updates.",
        "architecture_highlights": "Docker multistage builds, Kubernetes manifest deployments, ingress routing, distributed logging."
    },
    {
        "id": "proj-crossplatform-mobile",
        "title": "Real-Time Mobile Productivity & Sync App",
        "domain": "Mobile Development",
        "difficulty": "Intermediate",
        "estimated_hours": 30,
        "skills": ["Flutter", "TypeScript", "REST API", "Mobile Development", "Firebase"],
        "description": "Cross-platform mobile application featuring offline-first local storage, real-time database synchronization, push notifications, and biometric auth.",
        "architecture_highlights": "State management, optimistic UI updates, background synchronization, responsive native UI."
    },
    {
        "id": "proj-highperf-backend-api",
        "title": "High-Throughput Distributed Cache & Asynchronous Worker API",
        "domain": "Backend Development",
        "difficulty": "Intermediate",
        "estimated_hours": 25,
        "skills": ["Python", "FastAPI", "Redis", "PostgreSQL", "Docker", "REST API"],
        "description": "Backend API capable of handling heavy concurrent traffic using asynchronous job queues, Redis caching, rate-limiting, and relational persistence.",
        "architecture_highlights": "Async/await I/O, cache invalidation strategies, database connection pooling, Swagger documentation."
    },
    {
        "id": "proj-deep-learning-cv",
        "title": "Computer Vision Edge Inference System",
        "domain": "AI / ML",
        "difficulty": "Advanced",
        "estimated_hours": 40,
        "skills": ["Python", "PyTorch", "OpenCV", "Deep Learning", "Docker"],
        "description": "Custom convolutional neural network trained for real-time object detection and segmentation, optimized for edge device inference.",
        "architecture_highlights": "Transfer learning, model quantization, data augmentation pipeline, real-time webcam feed processing."
    }
]

def optimize_portfolio_recommendations(
    user_skills: List[str],
    missing_skills: List[str],
    target_role: str,
    existing_projects: List[Dict[str, Any]],
    effort_budget_hours: int = 80,
    max_projects_count: int = 2
) -> Dict[str, Any]:
    """
    Executes the optimization algorithm to select candidate projects that maximize
    skill gap coverage and diversity while strictly honoring effort constraints.
    """
    constraints = OptimizationConstraints(
        max_effort_hours=effort_budget_hours,
        max_projects_count=max_projects_count
    )

    user_skills_clean = [s.strip() for s in user_skills if s]
    missing_skills_clean = [s.strip() for s in missing_skills if s]
    user_skills_lower = {s.lower() for s in user_skills_clean}
    missing_skills_lower = {s.lower() for s in missing_skills_clean}

    # Extract existing project domains
    existing_domains = [p.get("domain", "") or p.get("category", "") for p in existing_projects]

    scored_candidates = []

    for archetype in PROJECT_CATALOG:
        proj_skills = archetype["skills"]
        hours = archetype["estimated_hours"]
        domain = archetype["domain"]

        # Objective Function Calculations
        gap_gain = calculate_skill_gap_gain(proj_skills, missing_skills_clean, user_skills_clean)
        diversity_bonus = calculate_diversity_bonus(domain, existing_domains)
        
        # Calculate skills this project will teach that address missing gaps
        covered_gaps = [s for s in proj_skills if s.lower() in missing_skills_lower]
        new_skills = [s for s in proj_skills if s.lower() not in user_skills_lower]

        # Total Utility Score
        total_utility = gap_gain + diversity_bonus
        efficiency = calculate_effort_efficiency(total_utility, hours)

        scored_candidates.append({
            **archetype,
            "gap_gain": gap_gain,
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

    # Calculate Projected Improvements
    total_role_skills_count = len(user_skills_clean) + len(missing_skills_clean)
    if total_role_skills_count == 0:
        total_role_skills_count = 1
        
    current_match_pct = round((len(user_skills_clean) / total_role_skills_count) * 100, 1)

    # Skills after completing selected projects
    simulated_skills = set(user_skills_clean).union(newly_acquired_skills)
    projected_matched_count = len([s for s in (user_skills_clean + missing_skills_clean) if s in simulated_skills])
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

