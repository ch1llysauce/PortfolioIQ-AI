from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.ai.groq_coach import coach_engine

router = APIRouter(
    prefix="/api/coach",
    tags=["AI Coach"]
)


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message content")


class PortfolioContext(BaseModel):
    target_role: Optional[str] = "Software Engineer"
    match_score: Optional[float] = 0.0
    missing_skills: Optional[List[str]] = []
    acquired_skills: Optional[List[str]] = []
    health_score: Optional[float] = 0.0
    pillars: Optional[Dict[str, float]] = {}
    projects: Optional[List[Dict[str, Any]]] = []
    roadmaps: Optional[List[str]] = []


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[PortfolioContext] = None


class ChatResponse(BaseModel):
    message: str
    model: str
    is_demo: bool
    suggested_followups: List[str]


class CritiqueRequest(BaseModel):
    context: Optional[PortfolioContext] = None


class ProjectIdeasRequest(BaseModel):
    context: Optional[PortfolioContext] = None


@router.get("/status")
def get_coach_status():
    """
    Returns the live status of the Groq AI Coach connection.
    """
    return coach_engine.get_status()


@router.post("/chat", response_model=ChatResponse)
def chat_with_coach(req: ChatRequest):
    """
    Sends conversational messages to the Groq AI Coach with portfolio telemetry context.
    """
    try:
        raw_messages = [{"role": m.role, "content": m.content} for m in req.messages]
        ctx = req.context.model_dump() if req.context else {}
        result = coach_engine.chat(raw_messages, ctx)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Coach engine failed: {str(e)}")


@router.post("/critique")
def generate_critique(req: CritiqueRequest):
    """
    Generates an executive portfolio critique based on telemetry.
    """
    try:
        ctx = req.context.model_dump() if req.context else {}
        return coach_engine.generate_critique(ctx)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Critique generation failed: {str(e)}")


@router.post("/project-ideas")
def generate_project_ideas(req: ProjectIdeasRequest):
    """
    Generates targeted project ideas to close user's identified skill gaps.
    """
    try:
        ctx = req.context.model_dump() if req.context else {}
        return coach_engine.generate_project_ideas(ctx)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project idea generation failed: {str(e)}")

