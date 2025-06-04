// src/app/vendor.service.ts
// NO CHANGES REQUIRED
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VendorService {

  private apiUrl = "http://localhost:9090/vendors"; // Backend API URL


  constructor(private http: HttpClient) {}

  // 👉 Create a New Vendor
  createVendor(vendor: Vendor): Observable<string> {

    return this.http.post<string>(`${this.apiUrl}/save`, vendor, { responseType: 'text' as 'json' });
  }

  // 👉 Get All Vendors
  getVendors(): Observable<Vendor[]> {
    return this.http.get<Vendor[]>(`${this.apiUrl}/fetchAll`);
  }

  // 👉 Update an Existing Vendor
  updateVendor(vendor: Vendor): Observable<Vendor> {
    return this.http.put<Vendor>(`${this.apiUrl}/update`, vendor);
  }

  // 👉 Delete a Vendor
  deleteVendor(vendorId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deleteById/${vendorId}`);
  }
}

// Vendor DTO Model
export class Vendor {
  vendorId: number;
  vendorName: string;
  contactInfo: number;
  vendorEmail: string;

  constructor(vendorId: number, vendorName: string, contactInfo: number, vendorEmail: string) {
    this.vendorId = vendorId;
    this.vendorName = vendorName;
    this.contactInfo = contactInfo;
    this.vendorEmail = vendorEmail;
  }
}