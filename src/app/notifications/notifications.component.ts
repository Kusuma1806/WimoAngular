import { Component } from '@angular/core';
import { NotificationService } from '../notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notification',
  imports:[FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent {
  vendorId: number = 0;
  vendorEmail: string = '';
  messageBody: string = '';
  stockId: number = 0;

  constructor(private notificationService: NotificationService) {}

  sendNotification(): void {
    const notification = { vendorId: this.vendorId, vendorEmail: this.vendorEmail, body: this.messageBody };

    this.notificationService.sendNotification(notification).subscribe({
      next: (data) => console.log('✅ Notification Sent:', data),
      error: (err) => console.error('❌ Error sending notification:', err)
    });
  }

  notifyLowStock(): void {
    this.notificationService.notifyLowStock(this.stockId).subscribe({
      next: (response) => console.log('✅ Low Stock Alert:', response),
      error: (err) => console.error('❌ Error triggering low stock alert:', err)
    });
  }
}
