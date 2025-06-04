import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PerformanceMetricsService {
  private apiUrl = 'http://localhost:9090/metrics'; // ✅ Backend Base URL

  constructor(private http: HttpClient) {}

  // ✅ Get Performance Metrics by Type (Turnover / Space Utilization)
  getMetricsByType(type: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/bytype/${type}`);
  }

  // ✅ Trigger Backend Metrics Calculation
  calculateMetrics(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/calmetrics`);
  }
}


export class PerformanceMetrics {
  metricId: number;
  type: string;
  value: number;
  timestamp: Date;

  constructor(metricId: number, type: string, value: number, timestamp: Date) {
    this.metricId = metricId;
    this.type = type;
    this.value = value;
    this.timestamp = timestamp;
  }
}


