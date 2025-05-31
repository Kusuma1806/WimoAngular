import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // For Angular directives (*ngIf, *ngFor)
import { Router, RouterModule } from '@angular/router'; // For routing support

@Component({
  selector: 'app-dashboard',
  standalone: true, // Marks this component as standalone
  imports: [CommonModule, RouterModule], // Required modules
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  // Sidebar menu items
  menuItems = [
    { name: 'Zones', route: '/zones' },
    { name: 'Vendors', route: '/vendors' },
    { name: 'Stocks', route: '/stocks' },
    { name: 'Transactions', route: '/transactions' },
    { name: 'Notifications', route: '/notifications' },
    { name: 'Performance', route: '/performance' }
  ];

  constructor(private router: Router) {}
  navigateTo(route: string) {
    this.router.navigate([route]); // Navigates to selected section
  }
}
