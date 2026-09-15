import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface CareerRole {
  id: string;
  title: string;
  description?: string;
  required_skills?: string[];
  skills?: string[];
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

  private readonly CACHE_KEY = 'portfolioiq_career_roles_cache';
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  private inMemoryRoles: CareerRole[] | null = null;
  private lastFetchedAt: number = 0;

  private readFromLocalStorage(): { roles: CareerRole[]; timestamp: number } | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  private saveToLocalStorage(roles: CareerRole[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({
        roles,
        timestamp: Date.now()
      }));
    } catch {}
  }

  // Get all target career roles with memory/local caching & offline fallback
  async getCareerRoles(forceFresh = false) {
    const now = Date.now();

    // 1. Check in-memory cache
    if (!forceFresh && this.inMemoryRoles && (now - this.lastFetchedAt < this.CACHE_TTL_MS)) {
      return { data: this.inMemoryRoles, error: null };
    }

    // 2. Check localStorage cache
    const stored = this.readFromLocalStorage();
    if (!forceFresh && stored && (now - stored.timestamp < this.CACHE_TTL_MS)) {
      this.inMemoryRoles = stored.roles;
      this.lastFetchedAt = stored.timestamp;
      return { data: stored.roles, error: null };
    }

    // 3. Query Supabase
    try {
      const res = await this.supabase
        .from('career_roles')
        .select('*');

      if (res.error) {
        console.warn('Error fetching career roles from Supabase, using local fallback:', res.error);
        if (stored?.roles) {
          this.inMemoryRoles = stored.roles;
          return { data: stored.roles, error: null };
        }
        return res;
      }

      if (res.data) {
        res.data = res.data.map((r: any) => ({
          ...r,
          title: r.title || r.name || 'Target Role',
          name: r.name || r.title || 'Target Role'
        }));
        res.data.sort((a: any, b: any) => (a.title || '').localeCompare(b.title || ''));

        this.inMemoryRoles = res.data as CareerRole[];
        this.lastFetchedAt = now;
        this.saveToLocalStorage(this.inMemoryRoles);
      }
      return res;
    } catch (err) {
      console.warn('Network exception while querying career roles, using local fallback:', err);
      if (stored?.roles) {
        this.inMemoryRoles = stored.roles;
        return { data: stored.roles, error: null };
      }
      return { data: null, error: err };
    }
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

