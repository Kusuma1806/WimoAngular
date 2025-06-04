import { Component, OnInit } from '@angular/core';
import { TransactionLog, TransactionService } from '../transaction.service';
import { ZoneService, Zone } from '../zone.service'; // Import Zone interface
import { StockService, Stock } from '../stock.service'; // Import Stock interface
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe, KeyValuePipe } from '@angular/common'; // Import necessary pipes
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Assuming you have a router if you uncomment the "Back to Dashboard" button
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-transaction',
  imports: [CommonModule, FormsModule, 
       CurrencyPipe, DatePipe,
       TitleCasePipe, RouterModule,
       KeyValuePipe,MatIconModule,MatButtonModule], // Add pipes here
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {
  transactions: TransactionLog[] = [];
  filteredTransactions: TransactionLog[] = [];
  pagedTransactions: TransactionLog[] = [];

  // View control
  activeView: 'table' | 'timeline' | 'summary' = 'timeline'; // Default to table view

  searchQuery: string = '';
  currentPage = 1;
  itemsPerPage = 5; // Items per page for table view
  totalPages: number = 0;
  showCreateForm = false;

  // Initialize newTransaction with default values
  newTransaction: TransactionLog = new TransactionLog(0, 0, 0, 0, 0, 'inbound', new Date(), 0);

  // Note: editingTransaction is currently not used in HTML, but kept if you plan to add edit functionality
  editingTransaction: TransactionLog | null = null;

  startDate: string | null = null; // Changed to string to bind directly to input type="date"
  endDate: string | null = null;   // Changed to string to bind directly to input type="date"
  minPrice: number | null = null;  // Changed to null for clearer "no filter" state
  maxPrice: number | null = null;  // Changed to null for clearer "no filter" state

  successMessage: string | null = null; // Changed to null for initial state
  errorMessage: string | null = null;   // Changed to null for initial state

  stocks: Stock[] = []; // Use the imported Stock interface
  zones: Zone[] = [];   // Use the imported Zone interface
  users: any[] = []; // Assuming users data might be loaded, though not used in form dropdowns

  // Summary View data properties
  totalInboundQuantity: number = 0;
  totalOutboundQuantity: number = 0;
  totalTransactionValue: number = 0;
  transactionsByType: { [type: string]: number } = {}; // Object to store counts by type

  constructor(
    private transactionService: TransactionService,
    private zoneService: ZoneService,
    private stockService: StockService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.loadStocks();
    this.loadZones();
  }

  // --- Data Loading ---
  
  loadTransactions(): void {
    this.transactionService.getTransactions().subscribe({
      next: (data: TransactionLog[]) => {
        // This is the correct way to ensure 'timestamp' is a Date object.
        // Assuming your backend sends 'timestamp' as a string parsable by new Date().
        this.transactions = data.map(t => ({
          ...t,
          timestamp: new Date(t.timestamp) // Converts the string timestamp from backend to a Date object
        }));
        this.currentPage = 1;
        this.applyFilters();
      },
      error: (err) => {
        console.error('❌ Error fetching transactions:', err);
        this.setErrorMessage('Failed to load transactions.');
      }
    });
  }


  loadStocks(): void {
    this.stockService.getStockItems().subscribe({
      next: (data: Stock[]) => this.stocks = data,
      error: (err) => console.error('❌ Error fetching stocks:', err)
    });
  }

  loadZones(): void {
    this.zoneService.getZones().subscribe({
      next: (data: Zone[]) => this.zones = data,
      error: (err) => console.error('❌ Error fetching zones:', err)
    });
  }

  // --- Filtering and Pagination ---
  searchTransactions(): void {
    this.currentPage = 1; // Reset to first page when filtering
    this.applyFilters();
  }

  applyFilters(): void {
    let tempFiltered = [...this.transactions]; // Start with all transactions

    // Filter by Type (searchQuery)
    if (this.searchQuery) {
      const lowerCaseQuery = this.searchQuery.toLowerCase();
      tempFiltered = tempFiltered.filter(t =>
        t.type.toLowerCase().includes(lowerCaseQuery)
      );
    }

    // Filter by Date Range
    if (this.startDate) {
      const startDateTime = new Date(this.startDate);
      startDateTime.setHours(0, 0, 0, 0); // Set to start of the day
      tempFiltered = tempFiltered.filter(t => new Date(t.timestamp).getTime() >= startDateTime.getTime());
    }
    if (this.endDate) {
      const endDateTime = new Date(this.endDate);
      endDateTime.setHours(23, 59, 59, 999); // Set to end of the day
      tempFiltered = tempFiltered.filter(t => new Date(t.timestamp).getTime() <= endDateTime.getTime());
    }

    // Filter by Price Range
    if (this.minPrice !== null && this.minPrice !== undefined) {
      tempFiltered = tempFiltered.filter(t => t.price >= this.minPrice!);
    }
    if (this.maxPrice !== null && this.maxPrice !== undefined) {
      tempFiltered = tempFiltered.filter(t => t.price <= this.maxPrice!);
    }

    // Sort for Timeline View (always keep data sorted by timestamp for consistency)
    tempFiltered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Latest first

    this.filteredTransactions = tempFiltered;

    // Recalculate summary data whenever filters change
    this.calculateSummaryData();

    // Apply pagination ONLY if the active view is 'table'
    if (this.activeView === 'table') {
      this.calculatePagination();
      this.paginateTransactions();
    } else {
      // If not table view, pagedTransactions should not be used or cleared
      this.pagedTransactions = [];
    }
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
    // Ensure currentPage is valid after filtering
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1; // If no results, default to page 1
    }
  }

  paginateTransactions(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedTransactions = this.filteredTransactions.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateTransactions();
    }
  }

  // --- Summary Data Calculation (NEW) ---
  calculateSummaryData(): void {
    this.totalInboundQuantity = 0;
    this.totalOutboundQuantity = 0;
    this.totalTransactionValue = 0;
    this.transactionsByType = {}; // Reset counts

    this.filteredTransactions.forEach(t => {
      if (t.type === 'inbound') {
        this.totalInboundQuantity += t.quantity;
      } else if (t.type === 'outbound') {
        this.totalOutboundQuantity += t.quantity;
      }
      this.totalTransactionValue += t.price * t.quantity;

      // Count transactions by type
      this.transactionsByType[t.type] = (this.transactionsByType[t.type] || 0) + 1;
    });
  }

  // --- Create Transaction Form and Modal ---
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      // Reset newTransaction for a fresh form
      this.newTransaction = new TransactionLog(0, 0, 0, 0, 0, 'inbound', new Date(), 0);
    }
  }

  createTransaction(): void {
    // Basic validation
    if (!this.newTransaction.stockId || !this.newTransaction.userId || !this.newTransaction.zoneId ||
        this.newTransaction.quantity <= 0 || !this.newTransaction.type || this.newTransaction.price <= 0) {
      this.setErrorMessage('Please fill all required fields correctly (quantity and price must be positive).');
      return;
    }

    // Set current timestamp
    this.newTransaction.timestamp = new Date();

    this.transactionService.createTransaction(this.newTransaction).subscribe({
      next: response => {
        console.log('✅ Transaction saved:', response);
        this.setSuccessMessage(response); // Assuming response is the success message string
        this.showCreateForm = false;
        this.loadTransactions(); // Reload all data to include new transaction
      },
      error: err => {
        console.error('❌ Error saving transaction:', err);
        // err.error contains the actual error message from the backend for text responses
        this.setErrorMessage('Failed to record transaction: ' + (err.error || err.message));
        // You might want to keep the form open on error for correction, or close it
        // this.showCreateForm = false;
      }
    });
  }

  // --- Delete Transaction ---
  deleteTransaction(transaction: TransactionLog): void {
    if (confirm(`Are you sure you want to delete transaction ID: ${transaction.transactionId}?`)) {
      this.transactionService.deleteTransaction(transaction.transactionId).subscribe({
        next: (response) => {
          console.log('✅ Transaction deleted successfully.', response);
          this.setSuccessMessage('Transaction deleted successfully!');
          this.loadTransactions(); // Reload data
        },
        error: (err) => {
          console.error('❌ Error deleting transaction:', err);
          this.setErrorMessage('Failed to delete transaction: ' + (err.error || err.message));
        }
      });
    }
  }

  // --- View Toggle (NEW) ---
  toggleView(view: 'table' | 'timeline' | 'summary'): void {
    this.activeView = view;
    // When switching views, re-apply filters to ensure data is correctly prepared for the new view
    // (e.g., pagination for table, sorting for timeline, re-calculation for summary)
    this.currentPage = 1; // Reset page when changing view
    this.applyFilters();
  }

  // --- Message handling ---
  setErrorMessage(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = null, 5000); // Clear after 5 seconds
  }

  setSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = null, 5000); // Clear after 5 seconds
  }
}