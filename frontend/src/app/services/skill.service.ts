import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Skill {
  id: string;
  name: string;
  category: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  private supabase;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  // Get all available skills
  async getSkills() {
    return await this.supabase
      .from('skills')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
  }

  // Add a new skill definition
  async createSkill(name: string, category: string) {
    return await this.supabase
      .from('skills')
      .insert({ name, category })
      .select()
      .single();
  }

  // Add skill to a specific project
  async addSkillToProject(projectId: string, skillId: string) {
    return await this.supabase
      .from('project_skills')
      .insert({
        project_id: projectId,
        skill_id: skillId
      });
  }

  // Remove skill from a project
  async removeSkillFromProject(projectId: string, skillId: string) {
    return await this.supabase
      .from('project_skills')
      .delete()
      .eq('project_id', projectId)
      .eq('skill_id', skillId);
  }

  // Get all skills for a specific project
  async getSkillsByProject(projectId: string) {
    return await this.supabase
      .from('project_skills')
      .select(`
        skill_id,
        skills (
          id,
          name,
          category
        )
      `)
      .eq('project_id', projectId);
  }
}
