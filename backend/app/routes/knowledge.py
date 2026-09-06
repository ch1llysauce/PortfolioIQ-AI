"""
Stage 12 — Knowledge Graph API Router.
Exposes endpoints for graph visualization, prerequisite trees,
learning path resolution, and text entity extraction.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.knowledge.retrieval import (
    get_prerequisites_for_skill,
    get_skills_unlocked_by,
    get_role_skill_tree,
    get_technology_complements,
    get_learning_path,
    get_graph_visualization_data
)
from app.knowledge.entity_extractor import extract_entities_from_text

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])

class LearningPathRequest(BaseModel):
    goal_skill: str
    current_skills: List[str] = []

class EntityExtractRequest(BaseModel):
    text: str

@router.get("/graph")
def get_full_graph():
    """Returns nodes and edges formatted for visual network rendering."""
    return get_graph_visualization_data()

@router.get("/role-tree/{role_title}")
def get_role_tree_endpoint(role_title: str):
    """Returns the full hierarchical skill tree for a specific career role."""
    return get_role_skill_tree(role_title)

@router.get("/prerequisites/{skill_name}")
def get_prerequisites_endpoint(skill_name: str):
    """Returns ordered prerequisite skills needed before learning skill_name."""
    return {
        "skill": skill_name,
        "prerequisites": get_prerequisites_for_skill(skill_name)
    }

@router.get("/unlocked-skills/{skill_name}")
def get_unlocked_endpoint(skill_name: str):
    """Returns skills and tools unlocked after mastering skill_name."""
    return {
        "skill": skill_name,
        "unlocked_skills": get_skills_unlocked_by(skill_name)
    }

@router.get("/complements/{tech_name}")
def get_complements_endpoint(tech_name: str):
    """Returns technologies and tools commonly paired with tech_name."""
    return {
        "technology": tech_name,
        "complements": get_technology_complements(tech_name)
    }

@router.post("/learning-path")
def calculate_learning_path_endpoint(request: LearningPathRequest):
    """Calculates personalized step-by-step prerequisite roadmap toward a target skill."""
    return get_learning_path(request.goal_skill, request.current_skills)

@router.post("/extract")
def extract_entities_endpoint(request: EntityExtractRequest):
    """Extracts and normalizes skills, technologies, and roles from raw text."""
    return extract_entities_from_text(request.text)
