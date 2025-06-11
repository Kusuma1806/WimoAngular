import { Component, OnInit, OnDestroy } from '@angular/core';
import { TransactionLog, TransactionService } from '../transaction.service';
import { ZoneService, Zone } from '../zone.service';
import { StockService, Stock } from '../stock.service';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HttpErrorResponse } from '@angular/common/http'; 
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { Observable, Subject } from 'rxjs'; // Import Subject
import { takeUntil } from 'rxjs/operators'; // Import takeUntil

// Import CommonService
import { CommonService } from '../common.service';

declare const Chart: any;

interface DailyTransactionSummary {
  date: string;
  totalInboundQuantity: number;
  totalOutboundQuantity: number;
  totalTransactionValue: number;
  transactionsByType: { [key: string]: number };
}

@Component({
  selector: 'app-transaction',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CurrencyPipe, DatePipe,
    TitleCasePipe, RouterModule,
    KeyValuePipe, MatIconModule, MatButtonModule,
    MatPaginatorModule,
    MatPaginator,
    MatCardModule
  ],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit, OnDestroy {

  isAdmin$: Observable<boolean>;
  transactions: TransactionLog[] = [];
  filteredTransactions: TransactionLog[] = [];
  pagedTransactions: TransactionLog[] = []; // For table view

  activeView: 'table' | 'timeline' | 'daily-summary' = 'timeline';

  searchQuery: string = '';
  currentPage = 1;
  itemsPerPage = 8;
  totalPages: number = 0;
  showCreateForm = false;

  newTransaction: TransactionLog = new TransactionLog(0, 0, 0, 0, 0, null as any, new Date(), 0);
  editingTransaction: TransactionLog | null = null; // No editing in this component, but keeping it for consistency if planned

  successMessage: string | null = null;
  errorMessage: string | null = null;

  stocks: Stock[] = [];
  zones: Zone[] = [];
  users: any[] = []; // You might want to load actual user data here

  allDailySummaries: DailyTransactionSummary[] = [];
  pagedDailySummaries: DailyTransactionSummary[] = [];
  dailySummaryPageSize = 3;
  dailySummaryPageIndex = 0;
  totalDailySummaries = 0;

  private dailyCharts: { [date: string]: { quantityChart?: any; typeChart?: any } } = {};
  private destroy$ = new Subject<void>(); // Added for RxJS teardown

  constructor(
    private transactionService: TransactionService,
    private zoneService: ZoneService,
    private stockService: StockService,
    private router: Router,
    private commonService: CommonService // Injected CommonService
  ) {
    this.isAdmin$ = this.commonService.isAdmin$; // Initialize isAdmin$
  }

  ngOnInit(): void {
    // Subscribe to admin status changes and handle component destruction
    this.isAdmin$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAdminStatus => {
        console.log('TransactionsComponent: Admin status updated:', isAdminStatus);
      });

    this.loadTransactions();
    this.loadStocks();
    this.loadZones();
  }

  ngOnDestroy(): void {
    this.destroy$.next(); // Emit a value to signal completion
    this.destroy$.complete(); // Complete the subject
    this.destroyAllDailyCharts();
  }

  private destroyAllDailyCharts(): void {
    for (const date in this.dailyCharts) {
      if (this.dailyCharts[date].quantityChart) {
        this.dailyCharts[date].quantityChart.destroy();
      }
      if (this.dailyCharts[date].typeChart) {
        this.dailyCharts[date].typeChart.destroy();
      }
    }
    this.dailyCharts = {};
  }

  // --- Data Loading ---
  loadTransactions(): void {
    this.transactionService.getTransactions().pipe(
      takeUntil(this.destroy$) // Ensure subscription is cleaned up
    ).subscribe({
      next: (data: TransactionLog[]) => {
        this.transactions = data.map(t => ({
          ...t,
          timestamp: new Date(t.timestamp)
        }));
        this.currentPage = 1;
        this.dailySummaryPageIndex = 0;
        this.applyFilters();
      },
      error: (err) => {
        console.error('❌ Error fetching transactions:', err);
        this.setErrorMessage('Failed to load transactions.');
      }
    });
  }

  loadStocks(): void {
    this.stockService.getStockItems().pipe(
      takeUntil(this.destroy$) // Ensure subscription is cleaned up
    ).subscribe({
      next: (data: Stock[]) => this.stocks = data,
      error: (err) => {
        console.error('❌ Error fetching stocks:', err);
        this.setErrorMessage('Failed to load stock data needed for transactions.');
      }
    });
  }

  loadZones(): void {
    this.zoneService.getZones().pipe(
      takeUntil(this.destroy$) // Ensure subscription is cleaned up
    ).subscribe({
      next: (data: Zone[]) => this.zones = data,
      error: (err) => {
        console.error('❌ Error fetching zones:', err);
        this.setErrorMessage('Failed to load zone data needed for transactions.');
      }
    });
  }

  // --- Filtering and Pagination ---
  searchTransactions(): void {
    this.currentPage = 1;
    this.dailySummaryPageIndex = 0;
    this.applyFilters();
  }

  applyFilters(): void {
    let tempFiltered = [...this.transactions];

    if (this.searchQuery) {
      const lowerCaseQuery = this.searchQuery.toLowerCase();
      tempFiltered = tempFiltered.filter(t =>
        t.type.toLowerCase().includes(lowerCaseQuery) ||
        String(t.stockId).toLowerCase().includes(lowerCaseQuery)
      );
    }

    tempFiltered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    this.filteredTransactions = tempFiltered;

    this.calculateDailySummaryData(); // Populates allDailySummaries

    // Apply pagination based on active view
    if (this.activeView === 'table') {
      this.calculatePagination();
      this.paginateTransactions();
    } else if (this.activeView === 'daily-summary') {
      this.applyDailySummaryPagination();
    } else { // For timeline view, no specific pagination for this component
      this.pagedTransactions = []; // Clear table paginated data
      this.pagedDailySummaries = []; // Clear daily summary paginated data
      this.destroyAllDailyCharts(); // Ensure charts are destroyed if view changes away from daily-summary
    }
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1;
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

  // --- Per-Day Summary Data Calculation ---
  calculateDailySummaryData(): void {
    const dailyMap = new Map<string, DailyTransactionSummary>();

    this.filteredTransactions.forEach(t => {
      // Ensure timestamp is a Date object before calling toISOString
      const transactionDate = (t.timestamp instanceof Date ? t.timestamp : new Date(t.timestamp)).toISOString().split('T')[0];

      if (!dailyMap.has(transactionDate)) {
        dailyMap.set(transactionDate, {
          date: transactionDate,
          totalInboundQuantity: 0,
          totalOutboundQuantity: 0,
          totalTransactionValue: 0,
          transactionsByType: {},
        });
      }

      const dailySummary = dailyMap.get(transactionDate)!;

      if (t.type === 'inbound') {
        dailySummary.totalInboundQuantity += t.quantity;
      } else if (t.type === 'outbound') {
        dailySummary.totalOutboundQuantity += t.quantity;
      }
      dailySummary.totalTransactionValue += t.price * t.quantity;

      dailySummary.transactionsByType[t.type] = (dailySummary.transactionsByType[t.type] || 0) + 1;
    });

    this.allDailySummaries = Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    this.totalDailySummaries = this.allDailySummaries.length;
  }

  // --- Apply Pagination for Daily Summaries (Modified for Charts) ---
  applyDailySummaryPagination(): void {
    this.destroyAllDailyCharts(); // Destroy charts from previous page
    const startIndex = this.dailySummaryPageIndex * this.dailySummaryPageSize;
    const endIndex = startIndex + this.dailySummaryPageSize;
    this.pagedDailySummaries = this.allDailySummaries.slice(startIndex, endIndex);

    // Render charts after the DOM has a chance to update
    // Use requestAnimationFrame for better timing with DOM updates if possible, or a slightly longer setTimeout
    setTimeout(() => {
      this.renderDailySummaryCharts();
    }, 50); // A small delay to ensure canvases are ready
  }

  // --- Handle Page Change for Daily Summaries ---
  onDailySummaryPageChange(event: PageEvent): void {
    this.dailySummaryPageIndex = event.pageIndex;
    this.dailySummaryPageSize = event.pageSize;
    this.applyDailySummaryPagination();
  }

  // --- Chart Rendering Logic for Daily Summaries ---
  renderDailySummaryCharts(): void {
    this.pagedDailySummaries.forEach(summary => {
      const quantityCanvas = document.getElementById('daily-qty-chart-' + summary.date) as HTMLCanvasElement;
      const typeCanvas = document.getElementById('daily-type-chart-' + summary.date) as HTMLCanvasElement;

      // Handle cases where canvas might not be found (e.g., if rendering too early or element ID mismatch)
      if (!quantityCanvas) {
        console.warn(`Canvas for daily quantity chart for date ${summary.date} not found.`);
      } else {
        this.renderDailyQuantityBarChart(quantityCanvas, summary);
      }

      if (!typeCanvas) {
        console.warn(`Canvas for daily type chart for date ${summary.date} not found.`);
      } else {
        this.renderDailyTypePieChart(typeCanvas, summary);
      }
    });
  }

  private renderDailyQuantityBarChart(canvas: HTMLCanvasElement, summary: DailyTransactionSummary): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context for daily quantity chart canvas.');
      return;
    }

    // Destroy existing chart for this date if it was previously rendered
    if (this.dailyCharts[summary.date] && this.dailyCharts[summary.date].quantityChart) {
      this.dailyCharts[summary.date].quantityChart.destroy();
    }

    // Ensure data exists before creating chart
    const inboundQty = summary.totalInboundQuantity || 0;
    const outboundQty = summary.totalOutboundQuantity || 0;
    const totalQty = inboundQty + outboundQty;

    if (totalQty === 0) {
      // Clear canvas or show "No data" message if no quantities
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.drawNoDataText(ctx, canvas, 'No Quantity Data');
      return;
    }

    this.dailyCharts[summary.date] = this.dailyCharts[summary.date] || {}; // Ensure object exists
    this.dailyCharts[summary.date].quantityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Inbound', 'Outbound'],
        datasets: [{
          data: [inboundQty, outboundQty],
          backgroundColor: [
            'rgba(40, 167, 69, 0.7)', // Success green
            'rgba(220, 53, 69, 0.7)'  // Danger red
          ],
          borderColor: [
            'rgba(40, 167, 69, 1)',
            'rgba(220, 53, 69, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Quantity'
          }
        },
        scales: {
          x: {
            stacked: true // Stack for quantity
          },
          y: {
            beginAtZero: true,
            stacked: true,
            title: {
              display: true,
              text: 'Items'
            }
          }
        }
      }
    });
  }

  private renderDailyTypePieChart(canvas: HTMLCanvasElement, summary: DailyTransactionSummary): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context for daily type chart canvas.');
      return;
    }

    // Destroy existing chart for this date if it was previously rendered
    if (this.dailyCharts[summary.date] && this.dailyCharts[summary.date].typeChart) {
      this.dailyCharts[summary.date].typeChart.destroy();
    }

    // Ensure data exists before creating chart
    const inboundTransactions = summary.transactionsByType['inbound'] || 0;
    const outboundTransactions = summary.transactionsByType['outbound'] || 0;
    const totalTransactions = inboundTransactions + outboundTransactions;

    if (totalTransactions === 0) {
      // Clear canvas or show "No data" message if no transactions
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.drawNoDataText(ctx, canvas, 'No Transaction Type Data');
      return;
    }

    this.dailyCharts[summary.date] = this.dailyCharts[summary.date] || {}; // Ensure object exists
    this.dailyCharts[summary.date].typeChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Inbound Transactions', 'Outbound Transactions'],
        datasets: [{
          data: [inboundTransactions, outboundTransactions],
          backgroundColor: [
            'rgba(23, 162, 184, 0.7)', // Info blue
            'rgba(255, 193, 7, 0.7)'  // Warning yellow
          ],
          borderColor: [
            'rgba(255, 255, 255, 1)',
            'rgba(255, 255, 255, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'Transaction Types'
          }
        }
      }
    });
  }

  // Helper function to draw "No Data" text on canvas
  private drawNoDataText(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, text: string): void {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#6c757d'; // Muted color
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  // --- Create Transaction Form and Modal ---
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.newTransaction = new TransactionLog(0, 0, 0, 0, 0, null as any, new Date(), 0);
      this.errorMessage = null; // Clear any previous errors when opening the form
      this.successMessage = null; // Clear any previous success messages
    }
  }

  createTransaction(): void {
    // Basic client-side validation
    if (!this.newTransaction.stockId || this.newTransaction.stockId === 0) {
      this.setErrorMessage('Please select a Stock.');
      this.showCreateForm = false;
      return;
    }
    if (!this.newTransaction.userId || this.newTransaction.userId <= 0) {
        this.setErrorMessage('Please enter a valid User ID (positive number).');
        this.showCreateForm = false;
        return;
    }
    if (!this.newTransaction.zoneId || this.newTransaction.zoneId === 0) {
        this.setErrorMessage('Please select a Zone.');
        this.showCreateForm = false;
        return;
    }
    if (this.newTransaction.quantity <= 0) {
        this.setErrorMessage('Quantity must be a positive number.');
        this.showCreateForm = false;
        return;
    }
    if (!this.newTransaction.type || this.newTransaction.type === 'null') { // Check for 'null' string if default option value is 'null'
        this.setErrorMessage('Please select a Transaction Type (Inbound/Outbound).');
        this.showCreateForm = false;
        return;
    }
    if (this.newTransaction.price <= 0) {
        this.setErrorMessage('Price must be a positive number.');
        this.showCreateForm = false;
        return;
    }

    this.newTransaction.timestamp = new Date(); // Ensure timestamp is current

    this.transactionService.createTransaction(this.newTransaction).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: response => {
        console.log('✅ Transaction saved:', response);
        this.setSuccessMessage('Transaction recorded successfully!');
        this.showCreateForm = false;
        this.loadTransactions();
      },
      error: (err: HttpErrorResponse) => { // Type 'err' as HttpErrorResponse
        // Log the full error for DEBUGGING purposes in development, but not for user display.
        console.error('❌ Error saving transaction in component (full object):', err);
        // Log the specific part that *should* be the user-friendly message
        console.error('❌ Error.error received from service:', err.error);
  
        let userFacingMessage = 'An unexpected error occurred. Please contact support.';
  
        // After the service modification, `err.error` should now be the simplified string
        if (typeof err.error === 'string' && err.error.trim() !== '') {
          userFacingMessage = err.error;
        } else if (err.message) {
          // Fallback for network errors or if service didn't process it as expected
          userFacingMessage = err.message;
        }
  
        this.setErrorMessage(`Failed to record transaction: ${userFacingMessage}`);
        this.showCreateForm = false; // Keep the form open on error for user to correct
      }
    });
  }

  // --- Delete Transaction ---
  deleteTransaction(transaction: TransactionLog): void {
    if (confirm(`Are you sure you want to delete transaction ID: ${transaction.transactionId}?`)) {
      this.transactionService.deleteTransaction(transaction.transactionId).pipe(
        takeUntil(this.destroy$) // Ensure subscription is cleaned up
      ).subscribe({
        next: (response) => {
          console.log('✅ Transaction deleted successfully.', response);
          this.setSuccessMessage('Transaction deleted successfully!');
          this.loadTransactions();
        },
        error: (err) => {
          console.error('❌ Error deleting transaction:', err);
          const backendError = err.error ? (typeof err.error === 'string' ? err.error : (err.error.message || JSON.stringify(err.error))) : 'An unknown error occurred.';
          this.setErrorMessage(`Failed to delete transaction: ${backendError}`);
        }
      });
    }
  }

  // --- View Toggle ---
  toggleView(view: 'table' | 'timeline' | 'daily-summary'): void {
    this.activeView = view;
    // Reset pagination based on the new active view
    if (this.activeView === 'table') {
      this.currentPage = 1;
    } else if (this.activeView === 'daily-summary') {
      this.dailySummaryPageIndex = 0;
    } else { // If switching away from daily-summary, destroy charts
      this.destroyAllDailyCharts();
    }
    this.applyFilters(); // This will trigger the correct data preparation logic and chart rendering
  }

  // --- Message handling ---
  setErrorMessage(message: string): void {
    this.errorMessage = message;
    this.successMessage = null; // Clear success message if an error occurs
    setTimeout(() => this.errorMessage = null, 7000); // Increased visibility time
  }

  setSuccessMessage(message: string): void {
    this.successMessage = message;
    this.errorMessage = null; // Clear error message if success occurs
    setTimeout(() => this.successMessage = null, 5000);
  }

  // Helper functions to get stock/zone names
  getStockName(stockId: number): string {
    const stock = this.stocks.find(s => s.stockId === stockId);
    return stock ? stock.stockName : 'Stock Deleted';
  }

  getZoneName(zoneId: number): string {
    const zone = this.zones.find(z => z.zoneId === zoneId);
    return zone ? zone.zoneName : 'Zone Deleted';
  }
}