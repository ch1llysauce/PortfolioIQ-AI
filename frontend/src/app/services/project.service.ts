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
    description: string
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
        description
      })
      .select()
      .single();
  }

  async getProjects() {
    return await this.supabase
      .from('projects')
      .select(`
        *,
        project_skills (
          skill_id,
          skills (
            id,
            name,
            category
          )
        )
      `)
      .order('created_at', {
        ascending: false
      });
  }


  async deleteProject(id: string) {

    return await this.supabase
      .from('projects')
      .delete()
      .eq('id', id);
  }
}