import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private apiUrl = "http://localhost:9090/auth/new"; // Update with your backend endpoint

  constructor(private http: HttpClient) {}

  register(userData: Register): Observable<any> {
    return this.http.post(this.apiUrl, userData,{ responseType: 'text' });
  }
}
export class Register{
  name: string; 
  email: string;
  password: string; 
  roles: string 
  constructor(name:string,email:string,password:string,roles: string ){
    this.name=name
    this.email=email
    this.password=password
    this.roles=roles
  }
}

