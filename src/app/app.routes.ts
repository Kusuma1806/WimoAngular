import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { FooterComponent } from './footer/footer.component';
import { PerformanceComponent } from './performance/performance.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { StocksComponent } from './stocks/stocks.component';
import { VendorsComponent } from './vendors/vendors.component';
import { ZoneComponent } from './zones/zones.component';
import { authGuard } from './auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
    {path:'',component:LandingComponent},
    {path:'landing',component:LandingComponent},
    {path:'login',component:LoginComponent},
    {path:'register',component:RegistrationComponent},
    {path:'footer',component:FooterComponent},
    {path:'dashboard',component:DashboardComponent},
    { path: 'zones', component: ZoneComponent },
    { path: 'vendors', component: VendorsComponent },
    { path: 'stocks', component: StocksComponent },
    { path: 'transactions', component: TransactionsComponent },
    { path: 'notifications', component: NotificationsComponent },
    { path: 'performance', component: PerformanceComponent ,canActivate:[authGuard]},
];
