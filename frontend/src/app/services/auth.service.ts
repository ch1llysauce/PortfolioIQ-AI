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

    async getUser() {
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
}