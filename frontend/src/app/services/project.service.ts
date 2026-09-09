import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private supabase;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  async createProject(
    name: string,
    description: string,
    status: string = 'active'
  ) {

    const {
      data: { user },
      error: userError
    } = await this.supabase.auth.getUser();

    if (userError || !user) {
      return {
        data: null,
        error: userError ?? new Error('User is not logged in')
      };
    }

    return await this.supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        description,
        status
      })
      .select()
      .single();
  }

  async getProjects() {
    // Ensure active auth session is hydrated before querying RLS-protected projects
    await this.supabase.auth.getSession();

    // 1. Fetch user projects
    const { data: projects, error: projectsError } = await this.supabase
      .from('projects')
      .select('*')
      .order('created_at', {
        ascending: false
      });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return { data: null, error: projectsError };
    }

    if (!projects || projects.length === 0) {
      return { data: [], error: null };
    }

    // 2. Fetch project skills with skills relation
    const projectIds = projects.map(p => p.id);
    const { data: projectSkills, error: skillsError } = await this.supabase
      .from('project_skills')
      .select(`
        project_id,
        skill_id,
        skills (
          id,
          name,
          category
        )
      `)
      .in('project_id', projectIds);

    if (skillsError) {
      console.warn('Could not load project skills (will return projects without skills):', skillsError);
    }

    // 3. Map skills into each project
    const skillsByProject = new Map<string, any[]>();
    (projectSkills || []).forEach((ps: any) => {
      if (!skillsByProject.has(ps.project_id)) {
        skillsByProject.set(ps.project_id, []);
      }
      skillsByProject.get(ps.project_id)!.push(ps);
    });

    const enrichedProjects = projects.map(p => ({
      ...p,
      project_skills: skillsByProject.get(p.id) || []
    }));

    return { data: enrichedProjects, error: null };
  }


  async updateProject(id: string, updates: { name?: string; description?: string; status?: string }) {
    return await this.supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  }

  async updateProjectStatus(id: string, status: string) {
    return await this.supabase
      .from('projects')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
  }

  async deleteProject(id: string) {
    return await this.supabase
      .from('projects')
      .delete()
      .eq('id', id);
  }
}
