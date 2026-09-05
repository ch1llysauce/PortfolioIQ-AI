"""
Optimization API Router for PortfolioIQ AI.
Exposes endpoints to run mathematical portfolio optimization and recommendations.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.optimization.portfolio_optimizer import optimize_portfolio_recommendations

router = APIRouter(prefix="/api/optimization", tags=["optimization"])

class OptimizationRequest(BaseModel):
    user_skills: List[str] = []
    missing_skills: List[str] = []
    target_role: Optional[str] = "General Developer"
    existing_projects: List[Dict[str, Any]] = []
    effort_budget_hours: Optional[int] = 80
    max_projects_count: Optional[int] = 2

@router.post("/recommend")
def get_portfolio_recommendations(request: OptimizationRequest):
    try:
        results = optimize_portfolio_recommendations(
            user_skills=request.user_skills,
            missing_skills=request.missing_skills,
            target_role=request.target_role or "General Developer",
            existing_projects=request.existing_projects,
            effort_budget_hours=request.effort_budget_hours or 80,
            max_projects_count=request.max_projects_count or 2
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Optimization algorithm execution failed: {str(e)}"
        )

