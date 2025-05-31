import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule,RouterLink,CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}
  onSubmit(form:NgForm)
  {
    console.log("logged in!!!")
    this.authService.login(form.value).subscribe(
      response => {
        console.log(response)
        if (response) {
          localStorage.setItem('token', response); // Store token
          this.router.navigate(['/dashboard']); // Redirect user after successful login
        } else {
          this.errorMessage = 'Invalid credentials, please try again.';
        }
      },
      error => {
        this.errorMessage = 'Login failed. Please check your username and password.';
        console.error(error);
      }
    );
    
  }
  
}
