import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-registration',
  imports: [ReactiveFormsModule, CommonModule,RouterLink,RouterOutlet],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit {
  registrationForm!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) { }

  ngOnInit(): void {
    this.registrationForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20), Validators.pattern('^[a-zA-Z0-9_]+$')]],
      email: ['', [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$')]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$') // Strong password
      ]],
      passwordRepeat: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]], // Ensures valid phone numbers (India format)
      role: ['', Validators.required], // Ensures the role is selected
      gender: ['', Validators.required],
      qualification: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const passwordRepeat = form.get('passwordRepeat')?.value;

    return password === passwordRepeat ? null : form.get('passwordRepeat')?.setErrors({ 'mismatch': true });
  }

  onSubmit(): void {
    console.log("hello")
    if (this.registrationForm.valid) {
      console.log('Form Submitted!', this.registrationForm.value);
      localStorage.setItem("uname", this.registrationForm.value.username);
      localStorage.setItem("password", this.registrationForm.value.password);
      this.router.navigate(["/login"]);
    }
  }

  onReset(): void {
    if (confirm("Are you sure you want to reset the form?")) {
      this.registrationForm.reset();
    }
  }

}
