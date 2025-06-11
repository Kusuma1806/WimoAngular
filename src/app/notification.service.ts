import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface AdminNotification {
  notificationId: number;
  stockName: string;
  stockQuantity: number;
  vendorName: string;
  vendorEmail: string;
  zoneName: string;
  adminEmails: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = 'http://localhost:9091/notifications'; // Adjust to your backend URL

  // BehaviorSubject to hold the current list of notifications and emit changes
  private _notifications = new BehaviorSubject<AdminNotification[]>([]);
  public readonly notifications$ = this._notifications.asObservable(); // Public observable for the list of notifications
  public readonly unreadCount$ = this.notifications$.pipe(
    map(notifications => notifications.length) // Count all notifications as 'unread' since there's no read status
  );

  constructor(private http: HttpClient) {}

  /**
   * Fetches notifications from the backend and updates the internal BehaviorSubject.
   * Components should call this when they need to refresh the list or trigger the count update.
   */
  fetchAndSetNotifications(): Observable<AdminNotification[]> {
    return this.http.get<AdminNotification[]>(`${this.baseUrl}/fetchAll`).pipe(
      tap(data => {
        this._notifications.next(data); // Update the BehaviorSubject with new data
      })
    );
  }

  /**
   * Deletes a notification by ID and optimistically updates the local list.
   * The `notifications$` and `unreadCount$` observables will automatically reflect this change.
   */
  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' }).pipe(
      tap(() => {
        // Optimistically update the local list after deletion
        const currentNotifications = this._notifications.getValue();
        const updatedNotifications = currentNotifications.filter(n => n.notificationId !== id);
        this._notifications.next(updatedNotifications);
      })
    );
  }
}