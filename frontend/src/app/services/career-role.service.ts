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
    const res = await this.supabase
      .from('career_roles')
      .select('*');

    if (res.data) {
      res.data = res.data.map((r: any) => ({
        ...r,
        title: r.title || r.name || 'Target Role',
        name: r.name || r.title || 'Target Role'
      }));
      res.data.sort((a: any, b: any) => (a.title || '').localeCompare(b.title || ''));
    }
    return res;
  }

  // Get required skills for a specific career role
  async getRoleSkills(roleId: string) {
    const res = await this.supabase
      .from('role_skills')
      .select(`
        *,
        skills (
          id,
          name,
          category
        )
      `)
      .eq('role_id', roleId);

    if (res.data) {
      res.data = res.data.map((item: any) => ({
        ...item,
        importance_level: item.importance_level || item.importance || 'required'
      }));
    }
    return res;
  }
}

