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

  private readonly CACHE_KEY = 'portfolioiq_skills_cache';
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  private inMemorySkills: Skill[] | null = null;
  private lastFetchedAt: number = 0;

  private readFromLocalStorage(): { skills: Skill[]; timestamp: number } | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  private saveToLocalStorage(skills: Skill[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({
        skills,
        timestamp: Date.now()
      }));
    } catch {}
  }

  private clearCache(): void {
    this.inMemorySkills = null;
    this.lastFetchedAt = 0;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.CACHE_KEY);
      } catch {}
    }
  }

  // Get all available skills with memory/local caching & offline fallback
  async getSkills(forceFresh = false) {
    const now = Date.now();

    // 1. Check in-memory cache
    if (!forceFresh && this.inMemorySkills && (now - this.lastFetchedAt < this.CACHE_TTL_MS)) {
      return { data: this.inMemorySkills, error: null };
    }

    // 2. Check localStorage cache
    const stored = this.readFromLocalStorage();
    if (!forceFresh && stored && (now - stored.timestamp < this.CACHE_TTL_MS)) {
      this.inMemorySkills = stored.skills;
      this.lastFetchedAt = stored.timestamp;
      return { data: stored.skills, error: null };
    }

    // 3. Query Supabase
    try {
      const res = await this.supabase
        .from('skills')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (res.error) {
        console.warn('Error fetching skills from Supabase, using local fallback:', res.error);
        if (stored?.skills) {
          this.inMemorySkills = stored.skills;
          return { data: stored.skills, error: null };
        }
        return res;
      }

      if (res.data) {
        this.inMemorySkills = res.data as Skill[];
        this.lastFetchedAt = now;
        this.saveToLocalStorage(res.data as Skill[]);
      }

      return res;
    } catch (err) {
      console.warn('Network exception while querying skills, using local fallback:', err);
      if (stored?.skills) {
        this.inMemorySkills = stored.skills;
        return { data: stored.skills, error: null };
      }
      return { data: null, error: err };
    }
  }

  // Add a new skill definition
  async createSkill(name: string, category: string) {
    this.clearCache();
    return await this.supabase
      .from('skills')
      .insert({ name, category })
      .select()
      .single();
  }

  // Update a skill category
  async updateSkillCategory(id: string, category: string) {
    this.clearCache();
    return await this.supabase
      .from('skills')
      .update({ category })
      .eq('id', id);
  }

  // Delete a skill definition from the catalog
  async deleteSkill(id: string) {
    this.clearCache();
    return await this.supabase
      .from('skills')
      .delete()
      .eq('id', id);
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
