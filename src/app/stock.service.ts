import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = "http://localhost:9090/stock"; // ✅ Backend Stock API URL

  constructor(private http: HttpClient) {}

  // 👉 Fetch all stock items
  getStockItems(): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrl}/fetchAll`);
  }
 
  // 👉 Create a new stock item
  createStock(stock: Stock): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/save`, stock,{ responseType: 'text' as 'json' }).pipe(
      catchError(error => {
        console.error("Error creating stock:", error);
        alert(error.error); // ✅ Show error message in alert
        return throwError(error);
      })
    );
  }
  
  // 👉 Update a stock item
  updateStock(stock: Stock): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/updateInbound`, stock);
  }

  // 👉 Delete a stock item
  deleteStock(stockId: number): Observable<string> { // ✅ Expecting string response
    return this.http.delete<string>(`${this.apiUrl}/deleteById/${stockId}`, { responseType: 'text' as 'json' });
  }  
}

// ✅ Stock Model
export class Stock {
  stockId: number;
  stockName: string;
  stockCategory: string;
  stockQuantity: number;
  zoneId: number;
  vendorId: number;

  constructor(stockId: number, stockName: string, stockCategory: string, stockQuantity: number, zoneId: number, vendorId: number) {
    this.stockId = stockId;
    this.stockName = stockName;
    this.stockCategory = stockCategory;
    this.stockQuantity = stockQuantity;
    this.zoneId = zoneId;
    this.vendorId = vendorId;
  }
}
