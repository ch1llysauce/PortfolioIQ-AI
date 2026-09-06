"""
Stage 12 — Entity Extractor.
Extracts and normalizes technical skills, frameworks, technologies,
and career roles from raw project descriptions, READMEs, or resume texts.
All entities and synonyms are dynamically loaded from data JSON files.
"""
import re
import json
from pathlib import Path
from typing import List, Dict, Set, Any, Optional

DATA_DIR = Path(__file__).parent / "data"

_CACHED_KNOWLEDGE: Optional[Dict[str, Any]] = None

def _load_knowledge_entities() -> Dict[str, Any]:
    """Loads and caches canonical entity lists and aliases from JSON files."""
    global _CACHED_KNOWLEDGE
    if _CACHED_KNOWLEDGE is not None:
        return _CACHED_KNOWLEDGE

    skills_file = DATA_DIR / "skills.json"
    techs_file = DATA_DIR / "technologies.json"
    roles_file = DATA_DIR / "career_roles.json"
    aliases_file = DATA_DIR / "aliases.json"

    skills_list = []
    techs_list = []
    roles_list = []
    aliases_map = {}

    if skills_file.exists():
        with open(skills_file, "r", encoding="utf-8") as f:
            skills_list = [item["name"] for item in json.load(f)]

    if techs_file.exists():
        with open(techs_file, "r", encoding="utf-8") as f:
            techs_list = [item["name"] for item in json.load(f)]

    if roles_file.exists():
        with open(roles_file, "r", encoding="utf-8") as f:
            roles_list = [item["title"] for item in json.load(f)]

    if aliases_file.exists():
        with open(aliases_file, "r", encoding="utf-8") as f:
            aliases_map = json.load(f)

    _CACHED_KNOWLEDGE = {
        "skills": skills_list,
        "technologies": techs_list,
        "roles": roles_list,
        "aliases": aliases_map,
        "skill_set": {s.lower(): s for s in skills_list},
        "tech_set": {t.lower(): t for t in techs_list},
        "role_set": {r.lower(): r for r in roles_list}
    }
    return _CACHED_KNOWLEDGE

def _contains_term(text: str, term: str) -> bool:
    """
    Checks if a term exists in text using non-alphanumeric boundary checks.
    Properly handles special characters like C++, C#, CI/CD, and HTML/CSS.
    """
    escaped = re.escape(term)
    pattern = rf"(?<![a-zA-Z0-9_]){escaped}(?![a-zA-Z0-9_])"
    return bool(re.search(pattern, text, re.IGNORECASE))

def extract_entities_from_text(text: str) -> Dict[str, Any]:
    """
    Analyzes raw text and returns normalized skills, technologies, and career roles.
    
    Args:
        text (str): Raw project description, resume snippet, or commit message.
        
    Returns:
        Dict[str, Any]: {
            "skills": List[str],
            "technologies": List[str],
            "roles": List[str],
            "all_entities": List[str],
            "total_count": int
        }
    """
    if not text or not text.strip():
        return {
            "skills": [],
            "technologies": [],
            "roles": [],
            "all_entities": [],
            "total_count": 0
        }

    knowledge = _load_knowledge_entities()
    
    detected_skills: Set[str] = set()
    detected_techs: Set[str] = set()
    detected_roles: Set[str] = set()

    clean_text = f" {text} "

    # Step 1: Scan for known aliases & abbreviations from data/aliases.json
    for alias, canonical in knowledge["aliases"].items():
        if _contains_term(clean_text, alias):
            canonical_lower = canonical.lower()
            if canonical_lower in knowledge["tech_set"]:
                detected_techs.add(knowledge["tech_set"][canonical_lower])
            elif canonical_lower in knowledge["skill_set"]:
                detected_skills.add(knowledge["skill_set"][canonical_lower])
            elif canonical_lower in knowledge["role_set"]:
                detected_roles.add(knowledge["role_set"][canonical_lower])

    # Step 2: Scan for canonical technologies (e.g., PostgreSQL, Docker, Redis)
    for tech_name in knowledge["technologies"]:
        if _contains_term(clean_text, tech_name):
            detected_techs.add(tech_name)

    # Step 3: Scan for canonical skills (e.g., Python, SQL, MLOps, System Design)
    for skill_name in knowledge["skills"]:
        if _contains_term(clean_text, skill_name):
            detected_skills.add(skill_name)

    # Step 4: Scan for canonical career roles (e.g., AI Engineer, Full-Stack Developer)
    for role_title in knowledge["roles"]:
        if _contains_term(clean_text, role_title):
            detected_roles.add(role_title)

    sorted_skills = sorted(list(detected_skills))
    sorted_techs = sorted(list(detected_techs))
    sorted_roles = sorted(list(detected_roles))
    
    all_combined = sorted(list(detected_skills.union(detected_techs).union(detected_roles)))

    return {
        "skills": sorted_skills,
        "technologies": sorted_techs,
        "roles": sorted_roles,
        "all_entities": all_combined,
        "total_count": len(all_combined)
    }
