"""
Objective functions for Developer Portfolio Optimization.
Formulates multi-objective utility scores evaluating:
1. Skill Gap Reduction Gain
2. Domain Diversity Bonus
3. Redundancy / Overlap Penalty
4. Effort Efficiency (Gain per Hour)
"""
from typing import List, Set, Dict

# Domain relevance mapping for career roles
ROLE_DOMAINS: Dict[str, List[str]] = {
    "UI/UX Designer": ["UI/UX Design", "Design & Usability", "Frontend Development", "Web Development"],
    "Frontend Developer": ["Frontend Development", "Web Development", "UI/UX Design", "Mobile Development"],
    "Backend Developer": ["Backend Development", "Databases", "Distributed Systems", "API Engineering", "Cloud"],
    "Full-Stack Developer": ["Web Development", "Frontend Development", "Backend Development", "Databases"],
    "AI / ML Engineer": ["AI / ML", "AI & Data Science", "Deep Learning", "MLOps", "Data Science"],
    "Data Scientist": ["Data Science", "AI & Data Science", "Statistics & Analytics", "AI / ML"],
    "Data Engineer": ["Data Engineering", "Databases", "Distributed Systems", "ETL Pipelines"],
    "DevOps Engineer": ["DevOps", "Cloud Infrastructure", "Systems Engineering", "CI/CD"],
    "Mobile Developer": ["Mobile Development", "Frontend UI", "Frontend Development", "API Integration"],
    "System Architect": ["Software Architecture", "Distributed Systems", "Cloud Computing", "Backend Development"],
    "QA Engineer": ["Quality Engineering", "Automated Testing", "CI/CD", "Software Engineering"],
    "Product Manager": ["Product Management", "Agile / Scrum", "Analytics", "Technical Product Strategy"],
    "Security Engineer": ["Cybersecurity", "Cloud Security", "DevSecOps", "Cloud Infrastructure"],
    "Software Engineer": ["Software Engineering", "Backend Development", "Algorithms & Systems", "System Architecture"]
}

def calculate_role_domain_alignment(
    candidate_domain: str,
    target_role: str,
    covered_gaps_count: int = 0
) -> float:
    """
    Evaluates whether a candidate project archetype aligns with the target career role.
    Gives a massive boost to role-relevant domains and prevents irrelevant projects from outranking them.
    """
    valid_domains = ROLE_DOMAINS.get(target_role, [])
    c_lower = candidate_domain.lower()
    
    # Check direct or partial match with role's primary domains
    is_primary = any(c_lower in d.lower() or d.lower() in c_lower for d in valid_domains)
    
    if is_primary:
        return 20.0  # High alignment reward
    elif covered_gaps_count > 0:
        return 5.0   # Secondary alignment if it covers actual role gaps
    else:
        return -15.0  # Penalty for completely unrelated domains with 0 gap coverage

def calculate_skill_gap_gain(
    project_skills: List[str],
    missing_skills: List[str],
    user_skills: List[str],
    target_role: str = ""
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

    # Heavy weight for missing target skills (25.0 pts each), bonus for other new skills (2.0 pts each)
    gain = (len(covered_gaps) * 25.0) + (len(new_skills - covered_gaps) * 2.0)
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
        return 3.0  # Moderate bonus for expanding into a new domain
    elif count == 1:
        return 1.0  # Minor bonus
    else:
        return -3.0 # Mild penalty for redundancy in an already saturated domain

def calculate_effort_efficiency(
    total_gain: float,
    estimated_hours: int
) -> float:
    """
    Calculates ROI: Gain per estimated hour of development effort.
    """
    if estimated_hours <= 0:
        return max(0.1, total_gain)
    return round((max(0.1, total_gain) / estimated_hours) * 10, 2)


