import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  isDemo?: boolean;
}

export interface PortfolioContext {
  target_role?: string;
  match_score?: number;
  missing_skills?: string[];
  acquired_skills?: string[];
  health_score?: number;
  pillars?: { [key: string]: number };
  projects?: any[];
  roadmaps?: string[];
}

export interface ChatResponse {
  message: string;
  model: string;
  is_demo: boolean;
  suggested_followups: string[];
}

export interface CritiqueResponse {
  target_role: string;
  overall_health_score: number;
  missing_skills_count: number;
  critique_markdown: string;
  model: string;
  is_demo: boolean;
}

export interface ProjectIdeasResponse {
  target_role: string;
  target_skills_covered: string[];
  ideas_markdown: string;
  model: string;
  is_demo: boolean;
}

export interface CoachStatus {
  live: boolean;
  model: string;
  provider: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CoachService {
  private apiUrl = 'http://127.0.0.1:8000/api/coach';
  private supabase;

  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService
  ) {
    this.supabase = this.supabaseService.getClient();
  }

  getStatus(): Observable<CoachStatus> {
    return this.http.get<CoachStatus>(`${this.apiUrl}/status`);
  }

  sendMessage(messages: ChatMessage[], context?: PortfolioContext): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, {
      messages,
      context
    });
  }

  generateCritique(context?: PortfolioContext): Observable<CritiqueResponse> {
    return this.http.post<CritiqueResponse>(`${this.apiUrl}/critique`, {
      context
    });
  }

  generateProjectIdeas(context?: PortfolioContext): Observable<ProjectIdeasResponse> {
    return this.http.post<ProjectIdeasResponse>(`${this.apiUrl}/project-ideas`, {
      context
    });
  }

  /**
   * Saves a single chat message to Supabase database (cloud persistence)
   * with automatic fallback to localStorage.
   */
  async saveMessageToCloud(msg: ChatMessage): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      const storageKey = `portfolioiq_coach_messages_${user?.id || 'guest'}`;

      // 1. Sync to local storage backup
      if (typeof localStorage !== 'undefined') {
        const local = JSON.parse(localStorage.getItem(storageKey) || '[]');
        local.push(msg);
        localStorage.setItem(storageKey, JSON.stringify(local));
      }

      // 2. If user is authenticated, save directly to Supabase cloud table
      if (user) {
        await this.supabase.from('coach_messages').insert({
          user_id: user.id,
          role: msg.role,
          content: msg.content,
          is_demo: !!msg.isDemo,
          created_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Could not persist message to Supabase cloud (using local cache):', err);
    }
  }

  /**
   * Loads chat history from Supabase cloud database.
   * If table is not yet migrated or offline, loads from localStorage backup.
   */
  async loadMessagesFromCloud(): Promise<ChatMessage[] | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      const storageKey = `portfolioiq_coach_messages_${user?.id || 'guest'}`;

      if (user) {
        const { data, error } = await this.supabase
          .from('coach_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          const cloudMessages: ChatMessage[] = data.map((item: any) => ({
            role: item.role as 'user' | 'assistant' | 'system',
            content: item.content,
            timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
            isDemo: !!item.is_demo
          }));
          // Sync cloud messages to local cache
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(storageKey, JSON.stringify(cloudMessages));
          }
          return cloudMessages;
        }
      }

      // Fallback to local storage if user not logged in or cloud table empty
      if (typeof localStorage !== 'undefined') {
        const local = localStorage.getItem(storageKey);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('Could not load messages from Supabase cloud, checking local storage:', err);
    }
    return null;
  }

  /**
   * Clears conversation history in Supabase cloud and local storage.
   */
  async clearMessagesFromCloud(): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      const storageKey = `portfolioiq_coach_messages_${user?.id || 'guest'}`;

      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(storageKey);
      }

      if (user) {
        await this.supabase
          .from('coach_messages')
          .delete()
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.warn('Could not clear messages from Supabase cloud:', err);
    }
  }
}

