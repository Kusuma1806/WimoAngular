import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { CommonService } from '../common.service';
import { DashboardComponent } from '../dashboard/dashboard.component';

@Component({
  selector: 'app-login',
  imports: [FormsModule,RouterLink,CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router,private commonServices: CommonService) {}
  onSubmit(form: NgForm) {
    console.log("Logged in!!!");
    this.authService.login(form.value).subscribe(
      response => {
        console.log("Login Response:", response);
  
        if (response) {  // ✅ Ensure response has a token
          sessionStorage.setItem('token', response); // ✅ Store token properly
          sessionStorage.setItem("roles",this.commonServices.getUserRole())
          localStorage.setItem('username',form.value.username)
          console.log("Stored Token After Login:", sessionStorage.getItem("token")); // Debugging
          this.router.navigate(['/dashboard']); // ✅ Navigate only after storing the token
        } else {
          this.errorMessage = 'Invalid credentials, please try again.';
        }
      },
      error => {
        this.errorMessage = 'Login failed. Please check your username and password.';
        console.error("Login Error:", error);
      }
    );
  }
  
  
}
