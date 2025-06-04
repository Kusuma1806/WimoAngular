import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonService } from '../common.service';

@Component({
  selector: 'app-header',
  imports:[RouterLink,RouterOutlet,CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent  {
  // isLoggedIn: boolean = false;

  constructor(private router: Router,private commonService:CommonService) {}

  // ngOnInit(): void {
  //   this.isLoggedIn = !!sessionStorage.getItem('token'); // ✅ Check login status
  // }
  get isLoggedIn():boolean{
    if(this.commonService.getToken()){
      return true;
    }
    else{
      return this.commonService.logStatus();
    }
   
  }
  logout(): void {
    this.commonService.logout();
    sessionStorage.removeItem("token"); // ✅ Remove authentication token
    sessionStorage.removeItem("roles");
    localStorage.removeItem("username"); // ✅ Remove stored username
  //  this.isLoggedIn = false; // ✅ Update login status
    console.log('🚀 User logged out, navbar updated');
    this.router.navigate(['/login']); // ✅ Redirect to login page
  }
}
