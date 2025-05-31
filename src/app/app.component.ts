import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,LandingComponent,HeaderComponent,FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'WimoAngular';
  constructor(private router: Router) {}
  isDashboardRoute(): boolean {
    return this.router.url.includes('/dashboard'); // Returns true when on the dashboard
  }
}
