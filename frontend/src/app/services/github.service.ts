import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GitHubProfile {
  username: string;
  name: string;
  avatar_url: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
  location: string;
  blog: string;
}

export interface GitHubRepository {
  id: string;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stars: number;
  forks: number;
  topics: string[];
  updated_at: string;
  is_fork: boolean;
  detected_skills: string[];
  predicted_category: string;
  confidence_score: number;
}

export interface GitHubSummary {
  total_scanned_repos: number;
  total_stars: number;
  total_forks: number;
  language_distribution: { [language: string]: number };
  top_skills: { skill: string; repo_count: number }[];
  unique_skills_count: number;
}

export interface GitHubScanResponse {
  profile: GitHubProfile;
  repos: GitHubRepository[];
  summary: GitHubSummary;
}

export interface GitHubStatus {
  authenticated: boolean;
  rate_limit_limit?: number;
  rate_limit_remaining?: number;
  rate_limit_reset?: number;
  status: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GitHubService {
  private apiUrl = `${environment.apiUrl}/api/github`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<GitHubStatus> {
    return this.http.get<GitHubStatus>(`${this.apiUrl}/status`);
  }

  scanUser(username: string, limit: number = 30): Observable<GitHubScanResponse> {
    return this.http.get<GitHubScanResponse>(`${this.apiUrl}/scan/${encodeURIComponent(username)}?limit=${limit}`);
  }
}

