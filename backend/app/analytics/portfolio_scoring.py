from typing import List, Dict, Any

def calculate_portfolio_score(projects: List[Dict[str, Any]], total_skills_count: int) -> Dict[str, Any]:
    """
    Calculates an overall Portfolio Health Score (0-100) based on:
    - Project Volume (25 pts max for 5+ projects)
    - Skill Diversity (35 pts max for 10+ skills)
    - Project Detail Quality (20 pts max)
    - Activity & Status (20 pts max)
    """
    project_count = len(projects)

    # 1. Project Volume Score (max 25 pts for 5+ projects)
    volume_score = min(25.0, (project_count / 5.0) * 25.0)

    # 2. Skill Diversity Score (max 35 pts for 10+ skills)
    skill_score = min(35.0, (total_skills_count / 10.0) * 35.0)

    # 3. Description & Detail Quality (max 20 pts)
    detailed_projects = sum(
        1 for p in projects
        if p.get("description") and len(str(p.get("description")).strip()) >= 15
    )
    detail_score = (detailed_projects / project_count * 20.0) if project_count > 0 else 0.0

    # 4. Active / Completed Status Bonus (max 20 pts)
    active_projects = sum(
        1 for p in projects
        if str(p.get("status", "")).lower() in ["completed", "active", "in_progress", "in progress"]
    )
    status_score = (active_projects / project_count * 20.0) if project_count > 0 else 0.0

    total_health_score = round(volume_score + skill_score + detail_score + status_score, 1)

    return {
        "overall_health_score": total_health_score,
        "metrics": {
            "project_volume_score": round(volume_score, 1),
            "skill_diversity_score": round(skill_score, 1),
            "detail_quality_score": round(detail_score, 1),
            "activity_status_score": round(status_score, 1)
        },
        "stats": {
            "total_projects": project_count,
            "total_skills": total_skills_count
        }
    }

