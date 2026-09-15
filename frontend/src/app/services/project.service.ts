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
    status: string = 'completed',
    id?: string
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

    const payload: any = {
      user_id: user.id,
      name,
      description,
      status
    };
    if (id) {
      payload.id = id;
    }

    return await this.supabase
      .from('projects')
      .insert(payload)
      .select()
      .single();
  }

  private getCacheKey(userId?: string): string {
    return `portfolioiq_projects_cache_${userId || 'guest'}`;
  }

  getLocalCachedProjects(userId?: string): any[] | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.getCacheKey(userId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading local projects cache:', e);
    }
    return null;
  }

  private saveLocalCachedProjects(projects: any[], userId?: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.getCacheKey(userId), JSON.stringify(projects));
    } catch (e) {
      console.warn('Error saving local projects cache:', e);
    }
  }

  async getProjects(): Promise<{ data: any[] | null; error: any; fromCache?: boolean }> {
    let currentUserId: string | undefined;
    try {
      // Ensure active auth session is hydrated before querying RLS-protected projects
      const { data: { session } } = await this.supabase.auth.getSession();
      currentUserId = session?.user?.id;
    } catch (e) {
      // Auth session lookup might fail if Supabase is temporarily offline
    }

    if (!currentUserId && typeof localStorage !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.user?.id) {
                currentUserId = parsed.user.id;
                break;
              }
            }
          }
        }
      } catch {}
    }

    try {
      // 1. Fetch user projects
      const { data: projects, error: projectsError } = await this.supabase
        .from('projects')
        .select('*')
        .order('created_at', {
          ascending: false
        });

      if (projectsError) {
        console.warn('Error fetching projects from cloud (using local cache fallback):', projectsError);
        const cached = this.getLocalCachedProjects(currentUserId);
        if (cached) {
          return { data: cached, error: null, fromCache: true };
        }
        return { data: null, error: projectsError };
      }

      if (!projects || projects.length === 0) {
        this.saveLocalCachedProjects([], currentUserId);
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

      // Cache enriched projects for offline resilience
      this.saveLocalCachedProjects(enrichedProjects, currentUserId);

      return { data: enrichedProjects, error: null };
    } catch (err: any) {
      console.warn('Network exception while querying projects, using local cache fallback:', err);
      const cached = this.getLocalCachedProjects(currentUserId);
      if (cached) {
        return { data: cached, error: null, fromCache: true };
      }
      return { data: null, error: err };
    }
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
