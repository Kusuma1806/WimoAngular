import { Component} from '@angular/core';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router'; // Import Router and routing directives
import { CommonModule } from '@angular/common'; // For NgIf, NgFor etc.
import { CommonService } from '../common.service';

@Component({
  selector: 'app-dashboard',
  standalone: true, // Mark as standalone
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive], // Import necessary modules
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  constructor(private router: Router, private commonService: CommonService) { } // Inject Router and AuthService


  logout(): void {
    this.commonService.logout(); // Call the logout method from your AuthService
    this.router.navigate(['/landing']); // Redirect to login page after logout
  }

}