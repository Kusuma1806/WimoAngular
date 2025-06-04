import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ZoneService {

  private apiUrl="http://localhost:9090/zones"
  constructor(private http: HttpClient) {}

  // 👉 Create a New Zone (Returns a String Message)
  createZone(zone: Zone): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/save`, zone,{ responseType: 'text' as 'json' });
  }

  // 👉 Get All Zones
  getZones(): Observable<Zone[]> {
    return this.http.get<Zone[]>(`${this.apiUrl}/fetchAll`);
  }

 // 👉 Update an Existing Zone
  updateZone(zone: Zone): Observable<Zone> {
    return this.http.put<Zone>(`${this.apiUrl}/update`, zone);
  }

  //👉 Delete a Zone
  deleteZone(zoneId: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/deleteById/${zoneId}`, { responseType: 'text' as 'json' });
  }
}

export class Zone {
    zoneId: number
    zoneName: string
    totalCapacity: number
    storedCapacity: number
    constructor(zoneId: number,zoneName: string, totalCapacity: number,storedCapacity: number) {
    this.zoneId=zoneId
    this.zoneName=zoneName
    this.totalCapacity=totalCapacity
    this.storedCapacity=storedCapacity
  }
}