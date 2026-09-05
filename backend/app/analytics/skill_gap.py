from typing import List, Dict, Any, Set

def calculate_skill_gap(user_skills: List[str], required_role_skills: List[str]) -> Dict[str, Any]:
    """
    Calculates the match percentage, acquired skills, and missing skill gaps
    between a user's acquired skills and a target career role's required skills.
    """
    user_set: Set[str] = {s.strip().lower() for s in user_skills if s}
    required_set: Set[str] = {s.strip().lower() for s in required_role_skills if s}

    if not required_set:
        return {
            "match_percentage": 0.0,
            "matching_skills": [],
            "missing_skills": [],
            "additional_skills": list(user_skills)
        }

    matching_lower = user_set.intersection(required_set)
    missing_lower = required_set - user_set
    additional_lower = user_set - required_set

    # Map back to original casing
    orig_required_map = {s.strip().lower(): s for s in required_role_skills if s}
    orig_user_map = {s.strip().lower(): s for s in user_skills if s}

    matching_skills = [orig_required_map[s] for s in matching_lower if s in orig_required_map]
    missing_skills = [orig_required_map[s] for s in missing_lower if s in orig_required_map]
    additional_skills = [orig_user_map[s] for s in additional_lower if s in orig_user_map]

    match_percentage = round((len(matching_skills) / len(required_role_skills)) * 100, 2)

    return {
        "match_percentage": match_percentage,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "additional_skills": additional_skills
    }

