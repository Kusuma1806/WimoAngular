import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = "http://localhost:9090/auth/authenticate"; // Your backend API

  constructor(private client: HttpClient) {}

  login(authen:AuthRequest): Observable<any> {
    return this.client.post(this.apiUrl,authen,{ responseType: 'text' })
  }
}
export class AuthRequest{
  username:string
  password:string
  constructor(username:string,password:string){
    this.username=username
    this.password=password
  }
}
