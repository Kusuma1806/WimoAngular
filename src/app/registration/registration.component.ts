import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { RegisterService } from '../register.service';

@Component({
  selector: 'app-registration',
  imports: [ReactiveFormsModule, CommonModule,RouterLink,RouterOutlet],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit {
  registrationForm!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router,private registerService: RegisterService) { }
  errorMessage: string = '';

  ngOnInit(): void {
    this.registrationForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20), Validators.pattern('^[a-zA-Z0-9_]+$')]],
      email: ['', [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$')]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$') // Strong password
      ]],
      passwordRepeat: ['', Validators.required],
      roles: ['', Validators.required], // Ensures the role is selected
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const passwordRepeat = form.get('passwordRepeat')?.value;

    return password === passwordRepeat ? null : form.get('passwordRepeat')?.setErrors({ 'mismatch': true });
  }

  onSubmit(): void {
    if (this.registrationForm.valid) {
      console.log('Form Submitted!', this.registrationForm.value);
      localStorage.setItem("uname", this.registrationForm.value.name);
      localStorage.setItem("password", this.registrationForm.value.password);
      this.registerService.register(this.registrationForm.value).subscribe(
        response => {
          console.log('Registration successfull', response);
          this.router.navigate(['/login']); // Redirect to login after successful registration
        },
        error => {
          this.errorMessage = 'Registration failed. Please try again.';
          console.error(error);
        }
      );
    }
  }

  onReset(): void {
    if (confirm("Are you sure you want to reset the form?")) {
      this.registrationForm.reset();
    }
  }

}
