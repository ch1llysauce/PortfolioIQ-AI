import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  checkBackend(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(
      `${this.apiUrl}/api/health`
    );
  }
}
