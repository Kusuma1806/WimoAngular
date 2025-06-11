import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminNotification, NotificationService } from '../notification.service';
import { CommonService } from '../common.service';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit, OnDestroy {
  isAdmin: boolean = false;
  notifications: AdminNotification[] = [];
  showPanel: boolean = false; // This property is not used in the provided HTML.

  private destroy$ = new Subject<void>(); // Used for managing RxJS subscriptions

  constructor(private notificationService: NotificationService, private commonService: CommonService) { }

  ngOnInit(): void {
    // Check if the user is an ADMIN
    if (this.commonService.getUserRole() === 'ADMIN') {
      this.isAdmin = true; // Set isAdmin property if you use it in the template
      // Subscribe to the notifications$ stream from the service
      // This ensures `this.notifications` is always in sync with the service's data
      this.notificationService.notifications$
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
          this.notifications = data;
        });

      // Trigger the initial fetch of notifications when the component initializes
      this.notificationService.fetchAndSetNotifications()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => console.log('Notifications successfully loaded for NotificationComponent.'),
          error: (err) => console.error('Error loading notifications for NotificationComponent:', err)
        });
    } else {
      // Handle non-admin access, e.g., redirect or show a message
      console.warn('Non-admin user attempted to access notifications.');
      this.notifications = []; // Clear notifications if not admin
    }
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions when the component is destroyed
    this.destroy$.next();
    this.destroy$.complete();
  }

  deleteNotification(id: number): void {
    // Call the service method to delete the notification
    this.notificationService.deleteNotification(id)
      .pipe(takeUntil(this.destroy$)) // Ensure this deletion subscription is also cleaned up
      .subscribe({
        next: () => {
          console.log(`Notification ${id} deleted successfully.`);
          // The service's tap operator already updates the BehaviorSubject,
          // so `this.notifications` will be automatically updated via the subscription.
        },
        error: (err) => {
          console.error(`Error deleting notification ${id}:`, err);
          // TODO: Implement user-friendly error message display (e.g., MatSnackBar)
        }
      });
  }

  // This method is present in your original code but not used in the provided HTML.
  // Keeping it for completeness if you plan to use it.
  togglePanel(): void {
    this.showPanel = !this.showPanel;
  }
}