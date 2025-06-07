import { Component, OnInit, OnDestroy } from '@angular/core'; // Removed AfterViewInit, ViewChild, ElementRef
import { TransactionLog, TransactionService } from '../transaction.service';
import { ZoneService, Zone } from '../zone.service';
import { StockService, Stock } from '../stock.service';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator'; 
import { MatCardModule } from '@angular/material/card'; // Added MatCardModule for consistency

// IMPORTANT: Chart.js will be loaded via script tag in HTML, so no direct import here.
// We use 'declare const Chart: any;' to satisfy TypeScript.
declare const Chart: any; // Declares Chart as a global variable (assuming loaded via CDN)

// --- INTERFACE FOR DAILY SUMMARY (Existing) ---
interface DailyTransactionSummary {
  date: string; 
  totalInboundQuantity: number;
  totalOutboundQuantity: number;
  totalTransactionValue: number;
  transactionsByType: { [key: string]: number };
}
// --- END INTERFACE ---

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
    MatCardModule // Added MatCardModule
  ],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit, OnDestroy { // Implemented OnDestroy

  transactions: TransactionLog[] = [];
  filteredTransactions: TransactionLog[] = [];
  pagedTransactions: TransactionLog[] = []; // For table view

  // View control
  activeView: 'table' | 'timeline' | 'daily-summary' = 'timeline'; 

  searchQuery: string = '';
  currentPage = 1; 
  itemsPerPage = 5; 
  totalPages: number = 0; 
  showCreateForm = false;

  newTransaction: TransactionLog = new TransactionLog(0, 0, 0, 0, 0, 'inbound', new Date(), 0);
  editingTransaction: TransactionLog | null = null;

  successMessage: string | null = null;
  errorMessage: string | null = null;

  stocks: Stock[] = [];
  zones: Zone[] = [];
  users: any[] = [];

  // Overall Summary View data properties (REMOVED from here, now in OverallTransactionSummaryComponent)
  // totalInboundQuantity: number = 0;
  // totalOutboundQuantity: number = 0;
  // totalTransactionValue: number = 0;
  // transactionsByType: { [type: string]: number } = {};
  // totalTransactionsCount: number = 0; 

  // Properties for daily summaries (existing)
  allDailySummaries: DailyTransactionSummary[] = []; 
  pagedDailySummaries: DailyTransactionSummary[] = []; 
  dailySummaryPageSize = 3; 
  dailySummaryPageIndex = 0; 
  totalDailySummaries = 0; 

  // --- NEW: Chart instances storage for daily summaries ---
  private dailyCharts: { [date: string]: { quantityChart?: any; typeChart?: any } } = {};
  // --- END NEW ---

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

  // --- NEW: OnDestroy lifecycle hook for cleanup ---
  ngOnDestroy(): void {
    // Destroy all daily chart instances to prevent memory leaks
    this.destroyAllDailyCharts();
  }
  // --- END NEW ---

  // --- NEW: Helper to destroy all daily charts ---
  private destroyAllDailyCharts(): void {
    for (const date in this.dailyCharts) {
      if (this.dailyCharts[date].quantityChart) {
        this.dailyCharts[date].quantityChart.destroy();
      }
      if (this.dailyCharts[date].typeChart) {
        this.dailyCharts[date].typeChart.destroy();
      }
    }
    this.dailyCharts = {}; // Clear the map
  }
  // --- END NEW ---

  // --- Data Loading ---
  loadTransactions(): void {
    this.transactionService.getTransactions().subscribe({
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
        String(t.stockId).toLowerCase().includes(lowerCaseQuery) ||
        String(t.transactionId).toLowerCase().includes(lowerCaseQuery)
      );
    }

    tempFiltered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    this.filteredTransactions = tempFiltered;

    // We no longer call calculateOverallSummaryData here as it's in the dedicated component
    this.calculateDailySummaryData();  // Populates allDailySummaries

    // Apply pagination based on active view
    if (this.activeView === 'table') {
      this.calculatePagination(); 
      this.paginateTransactions(); 
    } else if (this.activeView === 'daily-summary') {
      this.applyDailySummaryPagination();
    } else { // For timeline view, clear paginated data
      this.pagedTransactions = []; 
      this.pagedDailySummaries = []; 
      this.destroyAllDailyCharts(); // Ensure charts are destroyed if view changes
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

  // --- Per-Day Summary Data Calculation (generates ALL daily summaries) ---
  calculateDailySummaryData(): void {
    const dailyMap = new Map<string, DailyTransactionSummary>();

    this.filteredTransactions.forEach(t => {
      const transactionDate = t.timestamp.toISOString().split('T')[0];

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
    setTimeout(() => {
      this.renderDailySummaryCharts();
    });
  }

  // --- Handle Page Change for Daily Summaries (existing) ---
  onDailySummaryPageChange(event: PageEvent): void {
    this.dailySummaryPageIndex = event.pageIndex;
    this.dailySummaryPageSize = event.pageSize;
    this.applyDailySummaryPagination();
  }

  // --- NEW: Helper to get percentage (useful for labels on charts) ---
  getPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
  }

  // --- NEW: Chart Rendering Logic for Daily Summaries ---
  renderDailySummaryCharts(): void {
    this.pagedDailySummaries.forEach(summary => {
      const quantityCanvas = document.getElementById('daily-qty-chart-' + summary.date) as HTMLCanvasElement;
      const typeCanvas = document.getElementById('daily-type-chart-' + summary.date) as HTMLCanvasElement;

      if (quantityCanvas) {
        this.renderDailyQuantityBarChart(quantityCanvas, summary);
      }
      if (typeCanvas) {
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

    this.dailyCharts[summary.date] = this.dailyCharts[summary.date] || {}; // Ensure object exists
    this.dailyCharts[summary.date].quantityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Inbound', 'Outbound'],
        datasets: [{
          data: [summary.totalInboundQuantity, summary.totalOutboundQuantity],
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

    this.dailyCharts[summary.date] = this.dailyCharts[summary.date] || {}; // Ensure object exists
    this.dailyCharts[summary.date].typeChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Inbound Transactions', 'Outbound Transactions'],
        datasets: [{
          data: [summary.transactionsByType['inbound'] || 0, summary.transactionsByType['outbound'] || 0],
          backgroundColor: [
            'rgba(23, 162, 184, 0.7)', // Info blue
            'rgba(255, 193, 7, 0.7)'   // Warning yellow
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
  // --- END NEW CHART RENDERING LOGIC ---


  // --- Create Transaction Form and Modal (existing) ---
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.newTransaction = new TransactionLog(0, 0, 0, 0, 0, 'inbound', new Date(), 0);
    }
  }

  createTransaction(): void {
    if (!this.newTransaction.stockId || !this.newTransaction.userId || !this.newTransaction.zoneId ||
        this.newTransaction.quantity <= 0 || !this.newTransaction.type || this.newTransaction.price <= 0) {
      this.setErrorMessage('Please fill all required fields correctly (quantity and price must be positive).');
      return;
    }

    this.newTransaction.timestamp = new Date();

    this.transactionService.createTransaction(this.newTransaction).subscribe({
      next: response => {
        console.log('✅ Transaction saved:', response);
        this.setSuccessMessage(response);
        this.showCreateForm = false;
        this.loadTransactions();
      },
      error: err => {
        console.error('❌ Error saving transaction:', err);
        this.setErrorMessage('Failed to record transaction: ' + (err.error || err.message));
      }
    });
  }

  // --- Delete Transaction (existing) ---
  deleteTransaction(transaction: TransactionLog): void {
    if (confirm(`Are you sure you want to delete transaction ID: ${transaction.transactionId}?`)) {
      this.transactionService.deleteTransaction(transaction.transactionId).subscribe({
        next: (response) => {
          console.log('✅ Transaction deleted successfully.', response);
          this.setSuccessMessage('Transaction deleted successfully!');
          this.loadTransactions();
        },
        error: (err) => {
          console.error('❌ Error deleting transaction:', err);
          this.setErrorMessage('Failed to delete transaction: ' + (err.error || err.message));
        }
      });
    }
  }

  // --- View Toggle (UPDATED for chart rendering) ---
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

  // --- Message handling (existing) ---
  setErrorMessage(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = null, 5000);
  }

  setSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = null, 5000);
  }

  // Helper functions to get stock/zone names (existing)
  getStockName(stockId: number): string {
    const stock = this.stocks.find(s => s.stockId === stockId);
    return stock ? stock.stockName : 'Unknown Stock';
  }

  getZoneName(zoneId: number): string {
    const zone = this.zones.find(z => z.zoneId === zoneId);
    return zone ? zone.zoneName : 'Unknown Zone';
  }
}
