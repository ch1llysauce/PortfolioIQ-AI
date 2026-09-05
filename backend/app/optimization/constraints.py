"""
Constraints definition for Portfolio Optimization.
Enforces limits on:
1. Maximum development time / effort budget (hours)
2. Maximum number of project recommendations
3. Minimum skill gap coverage threshold
"""
from typing import Dict, Any, List

class OptimizationConstraints:
    def __init__(
        self,
        max_effort_hours: int = 80,
        max_projects_count: int = 3,
        min_gain_threshold: float = 5.0
    ):
        self.max_effort_hours = max_effort_hours
        self.max_projects_count = max_projects_count
        self.min_gain_threshold = min_gain_threshold

    def is_within_effort(self, accumulated_hours: int, candidate_hours: int) -> bool:
        return (accumulated_hours + candidate_hours) <= self.max_effort_hours

    def is_within_count(self, selected_count: int) -> bool:
        return selected_count < self.max_projects_count

    def meets_gain_threshold(self, gain: float) -> bool:
        return gain >= self.min_gain_threshold

