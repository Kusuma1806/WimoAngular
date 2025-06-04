import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:9090/notifications'; // ✅ Backend Base URL

  constructor(private http: HttpClient) {}

  // ✅ Send a custom notification
  sendNotification(notification: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send`, notification);
  }

  // ✅ Trigger low stock notification
  notifyLowStock(stockId: number): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/low-stock/${stockId}`, {},{responseType:'text' as 'json'});
  }
}
export class Notification {
  id: number;
  body: string;
  vendorId: number;
  vendorEmail: string;

  constructor(id: number, body: string, vendorId: number, vendorEmail: string) {
    this.id = id;
    this.body = body;
    this.vendorId = vendorId;
    this.vendorEmail = vendorEmail;
  }
}
