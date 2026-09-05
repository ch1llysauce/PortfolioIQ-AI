import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RecommendedProject {
  id: string;
  title: string;
  domain: string;
  difficulty: string;
  estimated_hours: number;
  skills: string[];
  description: string;
  architecture_highlights: string;
  gap_gain: number;
  diversity_bonus: number;
  total_utility: number;
  efficiency_score: number;
  covered_gaps: string[];
  new_skills: string[];
}

export interface ImpactSimulation {
  current_match_percentage: number;
  projected_match_percentage: number;
  match_increase: number;
  projected_health_gain: number;
}

export interface OptimizationResponse {
  target_role: string;
  effort_budget_hours: number;
  allocated_effort_hours: number;
  recommended_projects: RecommendedProject[];
  optimal_skill_path: string[];
  impact_simulation: ImpactSimulation;
}

export interface OptimizationRequest {
  user_skills: string[];
  missing_skills: string[];
  target_role: string;
  existing_projects: any[];
  effort_budget_hours: number;
  max_projects_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class OptimizationService {
  private apiUrl = 'http://127.0.0.1:8000/api/optimization';

  constructor(private http: HttpClient) {}

  getRecommendations(request: OptimizationRequest): Observable<OptimizationResponse> {
    return this.http.post<OptimizationResponse>(`${this.apiUrl}/recommend`, request);
  }
}

