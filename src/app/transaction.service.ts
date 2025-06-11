import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
    return this.http.post<string>(`${this.apiUrl}/save`, transaction, { responseType: 'text' as 'json' })
      .pipe(
        catchError((error: HttpErrorResponse) => { // Explicitly type 'error' as HttpErrorResponse
          console.error('❌ Transaction failed in service (original error):', error);
  
          // It's generally best to let the component decide how to display the error,
          // but if you MUST simplify it in the service, do it like this:
          let specificBackendMessage = "An unknown error occurred.";
  
          // Attempt to parse the actual backend error body.
          // It could be a string that needs JSON.parse, or already an object.
          let parsedErrorBody: any = error.error;
          if (typeof error.error === 'string') {
            try {
              parsedErrorBody = JSON.parse(error.error);
            } catch (e) {
              // If it's a string but not valid JSON, maybe it's the message itself
              console.warn("⚠ Service: Could not parse error response as JSON string. Using raw string or generic message.");
              specificBackendMessage = error.error; // Use the raw string if it's not JSON
            }
          }
  
          // Now, check the structure of the parsed body for the message
          if (Array.isArray(parsedErrorBody) && parsedErrorBody.length > 0 && parsedErrorBody[0].message) {
            specificBackendMessage = parsedErrorBody[0].message;
          } else if (parsedErrorBody && parsedErrorBody.message) {
            specificBackendMessage = parsedErrorBody.message;
          } else if (parsedErrorBody && parsedErrorBody.error) { // Sometimes Spring Boot puts it here
            specificBackendMessage = parsedErrorBody.error;
          } else if (error.message) { // Fallback for network errors etc., from HttpErrorResponse itself
            specificBackendMessage = error.message;
          }
  
          // Re-throw an HttpErrorResponse, potentially with a simplified 'error' property
          // This ensures the component still receives an HttpErrorResponse object
          const simplifiedError = new HttpErrorResponse({
              error: specificBackendMessage, // This will be the `err.error` in the component
              headers: error.headers,
              status: error.status,
              statusText: error.statusText,
              url: error.url
          });
          return throwError(() => simplifiedError); // <-- RE-THROW HttpErrorResponse
        })
      );
  }

  // 👉 Get All Transactions
  getTransactions(): Observable<TransactionLog[]> {
    return this.http.get<TransactionLog[]>(`${this.apiUrl}/fetchAll`);
  }

  // 👉 Delete a Transaction
  deleteTransaction(transactionId: number): Observable<string> { // Changed return type to string as your backend sends text
    return this.http.delete<string>(`${this.apiUrl}/delete/${transactionId}`, { responseType: 'text' as 'json' })
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