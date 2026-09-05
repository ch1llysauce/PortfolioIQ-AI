import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClassifyProjectResponse {
  predicted_category: string;
  confidence_score: number;
  probabilities: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class MlService {
  private apiUrl = 'http://127.0.0.1:8000/api/ml';

  constructor(private http: HttpClient) {}

  // Predict project category using ML Scikit-Learn Model
  classifyProject(name: string, description: string): Observable<ClassifyProjectResponse> {
    return this.http.post<ClassifyProjectResponse>(`${this.apiUrl}/classify-project`, {
      name,
      description
    });
  }
}

