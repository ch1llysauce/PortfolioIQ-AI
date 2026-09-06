import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  category: string;
  color: string;
  size: number;
  degree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface KnowledgeGraphData {
  total_nodes: number;
  total_edges: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RoleTreeNode {
  name: string;
  type: string;
  category: string;
  level: string;
  prerequisites: string[];
}

export interface RoleSkillTreeResponse {
  role: string;
  description: string;
  core_domains: string[];
  total_requirements: number;
  foundational: RoleTreeNode[];
  intermediate: RoleTreeNode[];
  advanced: RoleTreeNode[];
}

export interface LearningPathResponse {
  goal_skill: string;
  is_ready_to_learn: boolean;
  already_acquired_prereqs: string[];
  missing_prerequisites_in_order: string[];
  total_prereqs_count: number;
}

export interface EntityExtractResponse {
  skills: string[];
  technologies: string[];
  roles: string[];
  all_entities: string[];
  total_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class KnowledgeService {
  private apiUrl = 'http://127.0.0.1:8000/api/knowledge';

  constructor(private http: HttpClient) {}

  // Fetch full graph network data
  getGraph(): Observable<KnowledgeGraphData> {
    return this.http.get<KnowledgeGraphData>(`${this.apiUrl}/graph`);
  }

  // Fetch role-specific skill tree
  getRoleTree(roleTitle: string): Observable<RoleSkillTreeResponse> {
    return this.http.get<RoleSkillTreeResponse>(`${this.apiUrl}/role-tree/${encodeURIComponent(roleTitle)}`);
  }

  // Fetch prerequisites for a single skill
  getPrerequisites(skillName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/prerequisites/${encodeURIComponent(skillName)}`);
  }

  // Fetch skills unlocked by a skill
  getUnlockedSkills(skillName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/unlocked-skills/${encodeURIComponent(skillName)}`);
  }

  // Fetch technology pairings / complements
  getComplements(techName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/complements/${encodeURIComponent(techName)}`);
  }

  // Compute personalized learning path towards a target skill
  getLearningPath(goalSkill: string, currentSkills: string[]): Observable<LearningPathResponse> {
    return this.http.post<LearningPathResponse>(`${this.apiUrl}/learning-path`, {
      goal_skill: goalSkill,
      current_skills: currentSkills
    });
  }

  // Extract entities from raw text
  extractEntities(text: string): Observable<EntityExtractResponse> {
    return this.http.post<EntityExtractResponse>(`${this.apiUrl}/extract`, { text });
  }
}
