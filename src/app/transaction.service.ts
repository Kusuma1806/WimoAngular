import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private apiUrl = "http://localhost:9090/transactionlog";

  constructor(private http: HttpClient) {}

  // 👉 Create a New Transaction (Returns a String Message)
  createTransaction(transaction: TransactionLog): Observable<string> {
    return this.http.post(`${this.apiUrl}/save`, transaction, { responseType: 'text' })
      .pipe(
        catchError(error => {
          console.error('❌ Transaction failed:', error);
          let errorMessage = "Failed to save transaction.";

          // Attempt to parse the error response if it's a stringified JSON
          if (error.error && typeof error.error === 'string') {
            try {
              const parsedError = JSON.parse(error.error);
              errorMessage = parsedError.message || errorMessage;
            } catch (e) {
              console.warn("⚠ Could not parse error response as JSON:", error.error);
            }
          } else if (error.message) {
            errorMessage = error.message;
          }

          // Specific check for "StockItem Not Found"
          if (errorMessage.includes("StockItem Not Found") || errorMessage.includes("Stock Not Found")) {
            errorMessage = "❌ Stock not found! Transaction failed.";
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // 👉 Get All Transactions
  getTransactions(): Observable<TransactionLog[]> {
    return this.http.get<TransactionLog[]>(`${this.apiUrl}/fetchAll`);
  }

  // 👉 Delete a Transaction
  deleteTransaction(transactionId: number): Observable<string> { // Changed return type to string as your backend sends text
    return this.http.delete(`${this.apiUrl}/delete/${transactionId}`, { responseType: 'text' })
      .pipe(
        catchError(error => {
          console.error('❌ Error deleting transaction:', error);
          let errorMessage = "Failed to delete transaction.";

          if (error.error && typeof error.error === 'string') {
            try {
              const parsedError = JSON.parse(error.error);
              errorMessage = parsedError.message || errorMessage;
            } catch (e) {
              console.warn("⚠ Could not parse error response as JSON:", error.error);
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          return throwError(() => new Error(errorMessage));
        })
      );
  }
}

// Your TransactionLog Class (Model)
export class TransactionLog {
  transactionId: number;
  stockId: number;
  userId: number;
  zoneId: number;
  quantity: number;
  type: string;
  timestamp: Date; // Keep as Date object for better handling in TS
  price: number;

  constructor(transactionId: number, stockId: number, userId: number, zoneId: number, quantity: number, type: string, timestamp: Date, price: number) {
    this.transactionId = transactionId;
    this.stockId = stockId;
    this.userId = userId;
    this.zoneId = zoneId;
    this.quantity = quantity;
    this.type = type;
    this.timestamp = timestamp;
    this.price = price;
  }
}