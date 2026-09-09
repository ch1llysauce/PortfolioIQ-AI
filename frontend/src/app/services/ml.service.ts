import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ClassifyProjectResponse {
  predicted_category: string;
  confidence_score: number;
  probabilities: { [key: string]: number };
  needs_details?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MlService {
  private apiUrl = 'http://127.0.0.1:8000/api/ml';

  constructor(private http: HttpClient) {}

  // Predict project category using ML Scikit-Learn Model
  classifyProject(name: string, description: string = '', skills: string[] = []): Observable<ClassifyProjectResponse> {
    return this.http.post<ClassifyProjectResponse>(`${this.apiUrl}/classify-project`, {
      name,
      description,
      skills
    }).pipe(
      map(res => {
        if (!res || res.confidence_score <= 28 || res.needs_details) {
          return {
            ...res,
            predicted_category: 'Needs More Details',
            needs_details: true
          };
        }
        return res;
      })
    );
  }
}

