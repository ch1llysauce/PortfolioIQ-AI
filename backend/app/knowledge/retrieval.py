"""
Stage 12 — Graph Retrieval Engine.
High-level query interface connecting the Knowledge Graph with the
analytics, recommendation optimizer, and the Stage 13 Groq AI Coach.
"""
from typing import List, Dict, Any, Optional
from app.knowledge.knowledge_graph import get_knowledge_graph

def get_prerequisites_for_skill(skill_name: str) -> List[Dict[str, Any]]:
    """Returns prerequisite skills required before learning skill_name."""
    kg = get_knowledge_graph()
    return kg.get_prerequisites(skill_name)

def get_skills_unlocked_by(skill_name: str) -> List[Dict[str, Any]]:
    """Returns advanced skills or frameworks unlocked after mastering skill_name."""
    kg = get_knowledge_graph()
    return kg.get_unlocked_skills(skill_name)

def get_role_skill_tree(role_title: str) -> Dict[str, Any]:
    """Returns hierarchical skill tree grouped by level for a career role."""
    kg = get_knowledge_graph()
    return kg.get_role_tree(role_title)

def get_technology_complements(tech_name: str) -> List[Dict[str, Any]]:
    """Returns tools, databases, and frameworks commonly paired with tech_name."""
    kg = get_knowledge_graph()
    return kg.get_complementary_tech(tech_name)

def get_learning_path(goal_skill: str, current_skills: List[str]) -> Dict[str, Any]:
    """
    Computes a personalized step-by-step learning path toward goal_skill.
    Identifies which prerequisites the user already has vs. which ones must be learned first.
    """
    kg = get_knowledge_graph()
    prereqs = kg.get_prerequisites(goal_skill)
    current_lower = {s.lower().strip() for s in current_skills}

    completed = []
    missing = []

    for p in prereqs:
        if p["name"].lower() in current_lower:
            completed.append(p["name"])
        else:
            missing.append(p["name"])

    return {
        "goal_skill": goal_skill,
        "is_ready_to_learn": len(missing) == 0,
        "already_acquired_prereqs": completed,
        "missing_prerequisites_in_order": missing,
        "total_prereqs_count": len(prereqs)
    }

def get_graph_visualization_data() -> Dict[str, Any]:
    """Exports nodes and edges ready for frontend graph network renderers."""
    kg = get_knowledge_graph()
    return kg.export_graph_data()
