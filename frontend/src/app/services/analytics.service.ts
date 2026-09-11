import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SkillGapRequest {
  user_skills: string[];
  required_skills: string[];
}

export interface SkillGapResponse {
  match_percentage: number;
  matching_skills: string[];
  missing_skills: string[];
  additional_skills: string[];
}

export interface ProjectItem {
  id?: string;
  name: string;
  description?: string;
  status?: string;
}

export interface PortfolioScoreRequest {
  projects: ProjectItem[];
  total_skills_count: number;
}

export interface PortfolioScoreResponse {
  overall_health_score: number;
  metrics: {
    project_volume_score: number;
    skill_diversity_score: number;
    detail_quality_score: number;
    activity_status_score: number;
  };
  stats: {
    total_projects: number;
    total_skills: number;
  };
}

export interface ResumeParseResponse {
  extracted_skills: string[];
  extracted_projects: {
    name: string;
    description: string;
    detected_skills: string[];
  }[];
  raw_text_length: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/api/analytics`;

  constructor(private http: HttpClient) {}

  // Calculate Skill Gap against a target role
  getSkillGap(userSkills: string[], requiredSkills: string[]): Observable<SkillGapResponse> {
    return this.http.post<SkillGapResponse>(`${this.apiUrl}/skill-gap`, {
      user_skills: userSkills,
      required_skills: requiredSkills
    });
  }

  // Calculate Portfolio Health Score
  getPortfolioScore(projects: ProjectItem[], totalSkillsCount: number): Observable<PortfolioScoreResponse> {
    return this.http.post<PortfolioScoreResponse>(`${this.apiUrl}/portfolio-score`, {
      projects: projects,
      total_skills_count: totalSkillsCount
    });
  }

  // Upload and parse PDF Resume
  parseResume(file: File): Observable<ResumeParseResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ResumeParseResponse>(`${this.apiUrl}/parse-resume`, formData);
  }
}


