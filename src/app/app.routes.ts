import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';

export const routes: Routes = [
    {path:"",component:LandingComponent},
    {path:"about-us",component:AboutUsComponent},
    {path:"login",component:LoginComponent},
    {path:"register",component:RegistrationComponent}
];
