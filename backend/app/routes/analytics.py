from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.analytics.skill_gap import calculate_skill_gap
from app.analytics.portfolio_scoring import calculate_portfolio_score
from app.analytics.resume_parser import parse_resume

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

class SkillGapRequest(BaseModel):
    user_skills: List[str]
    required_skills: List[str]

class ProjectItem(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    status: Optional[str] = "idea"

class PortfolioScoreRequest(BaseModel):
    projects: List[ProjectItem]
    total_skills_count: int

@router.post("/skill-gap")
def analyze_skill_gap(request: SkillGapRequest):
    return calculate_skill_gap(request.user_skills, request.required_skills)

@router.post("/portfolio-score")
def analyze_portfolio_score(request: PortfolioScoreRequest):
    projects_dict = [p.model_dump() for p in request.projects]
    return calculate_portfolio_score(projects_dict, request.total_skills_count)

@router.post("/parse-resume")
async def extract_resume_data(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported for resume extraction.")
    
    try:
        content = await file.read()
        extracted_data = parse_resume(content)
        return extracted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse resume PDF: {str(e)}")
