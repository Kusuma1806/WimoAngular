import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge'; // Make sure this is imported
import { CommonService } from '../common.service';
import { NotificationService } from '../notification.service'; // Import NotificationService
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatDividerModule,
    MatListModule,
    MatBadgeModule // Added MatBadgeModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  userProfile = {
    name: localStorage.getItem("username"),
    role: sessionStorage.getItem("roles"),
    lastLogin: new Date()
  };

  notificationCount$: Observable<number>; // Observable to hold the notification count
  private destroy$ = new Subject<void>(); // Used for managing RxJS subscriptions

  constructor(
    private commonService: CommonService,
    private notificationService: NotificationService // Inject NotificationService
  ) {
    // Initialize the notification count observable directly from the service
    this.notificationCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit(): void {
    // Fetch notifications when the dashboard loads to populate the service's BehaviorSubject.
    // This will automatically update `notificationCount$`.
    this.notificationService.fetchAndSetNotifications()
      .pipe(takeUntil(this.destroy$)) // Ensure this subscription is cleaned up
      .subscribe({
        next: () => console.log('Notifications fetched for dashboard count.'),
        error: (err) => console.error('Error fetching notifications for dashboard count:', err)
      });
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions when the component is destroyed
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout(): void {
    this.commonService.initiateLogoutConfirmation();
  }
}