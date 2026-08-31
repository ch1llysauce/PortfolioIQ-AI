import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  backendStatus = signal('Checking backend...');

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {

    this.apiService.checkBackend().subscribe({

      next: (response) => {
        console.log('Backend response:', response);

        if (response.status === 'ok') {
          this.backendStatus.set('Backend Connected!');
        }
      },

      error: (error) => {
        console.error('Backend error:', error);
        this.backendStatus.set('Backend Connection Failed!');
      }

    });

  }

  async register(email: string, password: string, displayName: string) {

    console.log('Register clicked:', email);

    const { data, error } =
      await this.authService.signUp(email, password, displayName);

    if (error) {
      console.error('Registration error:', error);
      return;
    }

    console.log('Registration successful:', data.user);
  }

  async login(email: string, password: string) {

    const { data, error } =
      await this.authService.signIn(
        email,
        password
      );

    if (error) {
      console.error('Login error:', error);
      return;
    }

    console.log('Login successful:', data.user);
  }

  async checkUser() {

  const user = await this.authService.getUser();

  console.log('Current user:', user);
}

async logout() {

  const { error } =
    await this.authService.signOut();

  if (error) {
    console.error('Logout error:', error);
    return;
  }

  console.log('Logout successful');
}
}