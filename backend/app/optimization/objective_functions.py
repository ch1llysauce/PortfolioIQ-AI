"""
Objective functions for Developer Portfolio Optimization.
Formulates multi-objective utility scores evaluating:
1. Skill Gap Reduction Gain
2. Domain Diversity Bonus
3. Redundancy / Overlap Penalty
4. Effort Efficiency (Gain per Hour)
"""
from typing import List, Set, Dict

def calculate_skill_gap_gain(
    project_skills: List[str],
    missing_skills: List[str],
    user_skills: List[str]
) -> float:
    """
    Measures how effectively a candidate project closes the user's missing target-role skills.
    Each missing skill covered grants high utility weight.
    """
    proj_skills_set = {s.lower().strip() for s in project_skills}
    missing_set = {s.lower().strip() for s in missing_skills}
    user_set = {s.lower().strip() for s in user_skills}

    # Skills in project that directly address identified gaps
    covered_gaps = proj_skills_set.intersection(missing_set)
    # New skills not currently owned by the user
    new_skills = proj_skills_set - user_set

    # Heavy weight for missing target skills (10.0 pts each), bonus for other new skills (2.0 pts each)
    gain = (len(covered_gaps) * 10.0) + (len(new_skills - covered_gaps) * 2.0)
    return gain

def calculate_diversity_bonus(
    candidate_domain: str,
    existing_domains: List[str]
) -> float:
    """
    Rewards projects that expand the developer's domain breadth without over-saturating
    already dominant domains.
    """
    count = existing_domains.count(candidate_domain)
    if count == 0:
        return 5.0  # High bonus for expanding into a brand-new domain
    elif count == 1:
        return 2.5  # Moderate bonus for solidifying a secondary domain
    else:
        return -2.0 # Mild penalty for redundancy in an already saturated domain

def calculate_effort_efficiency(
    total_gain: float,
    estimated_hours: int
) -> float:
    """
    Calculates ROI: Gain per estimated hour of development effort.
    """
    if estimated_hours <= 0:
        return total_gain
    return round((total_gain / estimated_hours) * 10, 2)

