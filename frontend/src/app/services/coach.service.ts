import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  isDemo?: boolean;
}

export interface PortfolioContext {
  target_role?: string;
  match_score?: number;
  missing_skills?: string[];
  acquired_skills?: string[];
  health_score?: number;
  pillars?: { [key: string]: number };
  projects?: any[];
  roadmaps?: string[];
}

export interface ChatResponse {
  message: string;
  model: string;
  is_demo: boolean;
  suggested_followups: string[];
}

export interface CritiqueResponse {
  target_role: string;
  overall_health_score: number;
  missing_skills_count: number;
  critique_markdown: string;
  model: string;
  is_demo: boolean;
}

export interface ProjectIdeasResponse {
  target_role: string;
  target_skills_covered: string[];
  ideas_markdown: string;
  model: string;
  is_demo: boolean;
}

export interface CoachStatus {
  live: boolean;
  model: string;
  provider: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CoachService {
  private apiUrl = 'http://127.0.0.1:8000/api/coach';

  constructor(private http: HttpClient) {}

  getStatus(): Observable<CoachStatus> {
    return this.http.get<CoachStatus>(`${this.apiUrl}/status`);
  }

  sendMessage(messages: ChatMessage[], context?: PortfolioContext): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, {
      messages,
      context
    });
  }

  generateCritique(context?: PortfolioContext): Observable<CritiqueResponse> {
    return this.http.post<CritiqueResponse>(`${this.apiUrl}/critique`, {
      context
    });
  }

  generateProjectIdeas(context?: PortfolioContext): Observable<ProjectIdeasResponse> {
    return this.http.post<ProjectIdeasResponse>(`${this.apiUrl}/project-ideas`, {
      context
    });
  }
}

