import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SubsystemDetail {
  name: string;
  status: string;
  framework?: string;
  version?: string;
  provider?: string;
  features?: string[];
  engine?: string;
  model_file?: string;
  classes?: string[];
  classes_count?: number;
  live?: boolean;
  model?: string;
  nodes_count?: number;
  relationships_count?: number;
  authenticated?: boolean;
  rate_limit_remaining?: number;
  rate_limit_limit?: number;
  error?: string;
  message?: string;
}

export interface SystemTelemetryResponse {
  timestamp: number;
  uptime_seconds: number;
  overall_health: string;
  subsystems: {
    api: SubsystemDetail;
    database: SubsystemDetail;
    machine_learning: SubsystemDetail;
    ai_coach: SubsystemDetail;
    knowledge_graph: SubsystemDetail;
    github_sync: SubsystemDetail;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private apiUrl = `${environment.apiUrl}/api/system`;

  constructor(private http: HttpClient) {}

  getSystemStatus(): Observable<SystemTelemetryResponse> {
    return this.http.get<SystemTelemetryResponse>(`${this.apiUrl}/status`);
  }
}

