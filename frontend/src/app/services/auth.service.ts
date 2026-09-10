import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private supabase;

    constructor(private supabaseService: SupabaseService) {
        this.supabase = this.supabaseService.getClient();
    }

    async signUp(
        email: string,
        password: string,
        displayName: string
    ) {
        return await this.supabase.auth.signUp({
            email,
            password,

            options: {
                data: {
                    display_name: displayName
                }
            }
        });
    }

    async signIn(email: string, password: string) {
        return await this.supabase.auth.signInWithPassword({
            email,
            password
        });
    }

    async signOut() {
        return await this.supabase.auth.signOut();
    }

    async getSession() {
        const { data: { session } } = await this.supabase.auth.getSession();
        return session;
    }

    async getUser() {
        // 1. Check active session first (synchronous cache, handles OAuth hash redirect tokens)
        const session = await this.getSession();
        if (session?.user) {
            return session.user;
        }

        // 2. Server-side validation fallback
        const {
            data: { user }
        } = await this.supabase.auth.getUser();

        return user;
    }

    async resetPasswordForEmail(email: string) {
        return await this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
    }

    async verifyRecoveryOtp(email: string, token: string) {
        return await this.supabase.auth.verifyOtp({
            email,
            token,
            type: 'recovery'
        });
    }

    async updateUserPassword(newPassword: string) {
        return await this.supabase.auth.updateUser({
            password: newPassword
        });
    }

    async updateUserData(data: any) {
        return await this.supabase.auth.updateUser({
            data: data
        });
    }

    async signInWithGitHub() {
        return await this.supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: window.location.origin,
                scopes: 'read:user user:email'
            }
        });
    }

    async linkWithGitHub() {
        return await this.supabase.auth.linkIdentity({
            provider: 'github',
            options: {
                redirectTo: window.location.origin
            }
        });
    }

    extractGitHubUsername(user: any): string | null {
        if (!user) return null;
        if (user.identities && Array.isArray(user.identities)) {
            const ghIdentity = user.identities.find((id: any) => id.provider === 'github');
            if (ghIdentity?.identity_data?.user_name) {
                return ghIdentity.identity_data.user_name;
            }
        }
        if (user.user_metadata?.user_name) {
            return user.user_metadata.user_name;
        }
        if (user.user_metadata?.preferred_username) {
            return user.user_metadata.preferred_username;
        }
        return null;
    }

    onAuthStateChange(callback: (event: string, session: any) => void) {
        return this.supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }

    async exchangeCodeForSession(code: string) {
        return await this.supabase.auth.exchangeCodeForSession(code);
    }

    async uploadResume(file: File, userId: string): Promise<{ publicUrl: string | null; error: any }> {
        const filePath = `${userId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await this.supabase.storage
            .from('resumes')
            .upload(filePath, file, { upsert: true });
            
        if (uploadError) return { publicUrl: null, error: uploadError };
        
        const { data } = this.supabase.storage.from('resumes').getPublicUrl(filePath);
        return { publicUrl: data.publicUrl, error: null };
    }

    async updateUserProfile(displayName: string) {
        return await this.supabase.auth.updateUser({
            data: {
                display_name: displayName,
                full_name: displayName
            }
        });
    }

    async updatePassword(password: string) {
        return await this.supabase.auth.updateUser({
            password
        });
    }
}
