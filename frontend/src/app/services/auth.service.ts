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
        return await this.supabase.auth.resetPasswordForEmail(email);
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
}