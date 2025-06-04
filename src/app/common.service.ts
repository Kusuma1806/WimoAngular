import { Injectable } from '@angular/core';
import { routes } from './app.routes';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  public isLoggedIn = false;
  constructor(private router:Router) { }
  getToken(): string  {
    return sessionStorage.getItem('token');
  }
  removeToken(){
    sessionStorage.removeItem('token');
    return true;
  }
 logout() :boolean{
  alert("logout successfully");
  sessionStorage.clear();
  this.isLoggedIn=false;
  this.router.navigate(['/landing'])
  return this.isLoggedIn;
 }
 logStatus(){
  return this.isLoggedIn;
 }
  getTokenPayload(): any | null {
    const token = this.getToken();
    console.log("...........toker",token)
    if (!token) return null;
 
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  }
 
  getUserRole(): string | null {
    const token = sessionStorage.getItem('token'); // ✅ Get token from session storage
  
    if (!token) {
      console.error('❌ No token found in session storage');
      return null;
    }
  
    try {
      // ✅ Decode JWT Token (Assuming it's Base64-encoded JSON)
      const payload = JSON.parse(atob(token.split('.')[1])); // Extracts payload from JWT
      return payload.roles ? payload.roles: null; // ✅ Return first role if available
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      return null;
    }
  }  
  
}
