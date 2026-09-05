import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface CareerRole {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CareerRoleService {
  private supabase;

  constructor(private supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.getClient();
  }

  // Get all target career roles
  async getCareerRoles() {
    return await this.supabase
      .from('career_roles')
      .select('*')
      .order('title', { ascending: true });
  }

  // Get required skills for a specific career role
  async getRoleSkills(roleId: string) {
    return await this.supabase
      .from('role_skills')
      .select(`
        importance_level,
        skills (
          id,
          name,
          category
        )
      `)
      .eq('role_id', roleId);
  }
}

