import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core'; 
import { CommonModule, CurrencyPipe, KeyValuePipe, TitleCasePipe } from '@angular/common';
import { TransactionLog, TransactionService } from '../transaction.service'; 

// Angular Material Imports
import { MatCardModule } from '@angular/material/card'; 
import { MatIconModule } from '@angular/material/icon'; 
import { MatButtonModule } from '@angular/material/button'; 
import { RouterModule } from '@angular/router'; 
import { MatToolbarModule } from '@angular/material/toolbar'; 
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 

declare const Chart: any; // Declares Chart as a global variable (assuming loaded via CDN)


@Component({
  selector: 'app-overall-transaction-summary',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    KeyValuePipe,
    TitleCasePipe,
    RouterModule, 
    MatCardModule, 
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,        
    MatProgressSpinnerModule 
  ],
  templateUrl: './overall-transaction-summary.component.html',
  styleUrls: ['./overall-transaction-summary.component.css']
})
export class OverallTransactionSummaryComponent implements OnInit, AfterViewInit, OnDestroy { 

  transactions: TransactionLog[] = []; 
  
  // Overall Summary View data properties (for total quantity bar chart and total value card)
  totalInboundQuantity: number = 0;
  totalOutboundQuantity: number = 0;
  totalTransactionValue: number = 0;
  transactionsByType: { [type: string]: number } = {}; // For transaction type pie chart
  totalTransactionsCount: number = 0; // For percentages in pie chart

  isLoading: boolean = false; 

  // --- Chart References ---
  @ViewChild('quantityBarChartCanvas') quantityBarChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typePieChartCanvas') typePieChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyTrendAreaChartCanvas') dailyTrendAreaChartCanvas!: ElementRef<HTMLCanvasElement>; // Changed ViewChild name

  // Chart instances
  quantityChart: any; 
  typeChart: any;     
  dailyTrendChart: any; // Changed chart instance name


  constructor(private transactionService: TransactionService) { }

  ngOnInit(): void {
    this.loadTransactions();
  }

  ngAfterViewInit(): void {
    // Chart rendering happens after data load, but this ensures canvases are available.
  }
  
  ngOnDestroy(): void {
    // Destroy all chart instances to prevent memory leaks
    if (this.quantityChart) {
      this.quantityChart.destroy();
    }
    if (this.typeChart) {
      this.typeChart.destroy();
    }
    if (this.dailyTrendChart) { // Updated instance name
      this.dailyTrendChart.destroy();
    }
  }

  loadTransactions(): void {
    this.isLoading = true;
    this.transactionService.getTransactions().subscribe({
      next: (data: TransactionLog[]) => {
        this.transactions = data.map(t => ({
          ...t,
          timestamp: new Date(t.timestamp) 
        }));
        this.calculateSummaryData(); 
        this.isLoading = false;
        this.renderAllCharts(); 
      },
      error: (err) => {
        console.error('❌ Error fetching transactions for overall summary:', err);
        this.isLoading = false;
      }
    });
  }

  // --- Consolidated Data Calculation for All Charts ---
  calculateSummaryData(): void {
    // Reset all summary properties
    this.totalInboundQuantity = 0;
    this.totalOutboundQuantity = 0;
    this.totalTransactionValue = 0;
    this.transactionsByType = {};
    this.totalTransactionsCount = 0;

    // Data for Daily Bar Chart
    const dailyInboundMap = new Map<string, number>();
    const dailyOutboundMap = new Map<string, number>();
    const dates: string[] = [];
    
    // Process all transactions
    this.transactions.forEach(t => {
      const transactionDate = t.timestamp.toISOString().split('T')[0]; 

      // Accumulate for overall summary
      if (t.type === 'inbound') {
        this.totalInboundQuantity += t.quantity;
      } else if (t.type === 'outbound') {
        this.totalOutboundQuantity += t.quantity;
      }
      this.totalTransactionValue += t.price * t.quantity;
      this.transactionsByType[t.type] = (this.transactionsByType[t.type] || 0) + 1;

      // Accumulate for daily trend
      if (!dates.includes(transactionDate)) {
        dates.push(transactionDate);
      }
      if (t.type === 'inbound') {
        dailyInboundMap.set(transactionDate, (dailyInboundMap.get(transactionDate) || 0) + t.quantity);
      } else if (t.type === 'outbound') {
        dailyOutboundMap.set(transactionDate, (dailyOutboundMap.get(transactionDate) || 0) + t.quantity);
      }
    });

    this.totalTransactionsCount = this.transactions.length; 

    // Sort dates for the trend chart
    dates.sort();
    const sortedDailyInboundQuantities: number[] = [];
    const sortedDailyOutboundQuantities: number[] = [];

    dates.forEach(date => {
      sortedDailyInboundQuantities.push(dailyInboundMap.get(date) || 0);
      sortedDailyOutboundQuantities.push(dailyOutboundMap.get(date) || 0);
    });

    // Store processed data for charts
    this.chartData.dailyLabels = dates;
    this.chartData.dailyInboundData = sortedDailyInboundQuantities;
    this.chartData.dailyOutboundData = sortedDailyOutboundQuantities;
  }

  // Object to hold chart-specific data arrays
  chartData = {
    dailyLabels: [] as string[],
    dailyInboundData: [] as number[],
    dailyOutboundData: [] as number[],
  };

  getPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
  }

  // Consolidated Chart Rendering
  renderAllCharts(): void {
    // Ensure canvases are available before rendering
    if (this.quantityBarChartCanvas && this.typePieChartCanvas && this.dailyTrendAreaChartCanvas) { // Updated ref name
      this.renderQuantityBarChart();
      this.renderTypePieChart();
      this.renderDailyTrendAreaChart(); // Updated method name
    } else {
      console.warn('One or more canvas elements not ready for chart rendering. Retrying...');
      setTimeout(() => this.renderAllCharts(), 100); 
    }
  }

  renderQuantityBarChart(): void {
    if (this.quantityChart) {
      this.quantityChart.destroy();
    }

    const ctx = this.quantityBarChartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context for quantity chart canvas.');
      return;
    }

    this.quantityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Total Inbound Quantity', 'Total Outbound Quantity'],
        datasets: [{
          label: 'Quantity',
          data: [this.totalInboundQuantity, this.totalOutboundQuantity],
          backgroundColor: [
            'powderblue', 
            'pink'  
          ],
          borderColor: [
            'powderblue',
            'pink'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantity'
            }
          }
        },
        plugins: {
          legend: {
            display: false 
          },
          title: {
            display: true,
            text: 'Total Inbound vs. Outbound Quantity'
          }
        }
      }
    });
  }

  renderTypePieChart(): void {
    if (this.typeChart) {
      this.typeChart.destroy();
    }

    const ctx = this.typePieChartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context for type chart canvas.');
      return;
    }

    const inboundCount = this.transactionsByType['inbound'] || 0;
    const outboundCount = this.transactionsByType['outbound'] || 0;

    this.typeChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Inbound Transactions', 'Outbound Transactions'],
        datasets: [{
          label: 'Number of Transactions',
          data: [inboundCount, outboundCount],
          backgroundColor: [
            'purple',  
            'orange'   
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
            position: 'top',
          },
          title: {
            display: true,
            text: 'Transaction Type Breakdown'
          }
        }
      }
    });
  }

  // --- REVERTED: Daily Trend Area Chart Rendering ---
  renderDailyTrendAreaChart(): void { // Renamed from renderDailyQuantityBarChart
    if (this.dailyTrendChart) { // Updated instance name
      this.dailyTrendChart.destroy();
    }

    const ctx = this.dailyTrendAreaChartCanvas.nativeElement.getContext('2d'); // Updated ViewChild ref
    if (!ctx) {
      console.error('Failed to get 2D context for daily trend area chart canvas.');
      return;
    }

    // Determine the maximum quantity across both inbound and outbound daily data
    const maxQuantity = Math.max(
      ...this.chartData.dailyInboundData,
      ...this.chartData.dailyOutboundData
    );

    // Calculate a suitable Y-axis max, rounded up to the nearest 500
    const yAxisMax = maxQuantity > 0 ? Math.ceil(maxQuantity / 500) * 500 : 500;


    this.dailyTrendChart = new Chart(ctx, { // Updated instance name
      type: 'line', // Set to 'line' type
      data: {
        labels: this.chartData.dailyLabels,
        datasets: [
          {
            label: 'Inbound Quantity',
            data: this.chartData.dailyInboundData,
            // --- NEW MIXED COLORS ---
            borderColor: 'rgba(123, 104, 238, 1)', // Medium Slate Blue
            backgroundColor: 'rgba(123, 104, 238, 0.4)', // Faded Medium Slate Blue
            // --- END NEW MIXED COLORS ---
            tension: 0.4, // Smoother lines
            fill: true, // Key property for Area Chart
            pointRadius: 3, // Smaller points for area chart
            pointBackgroundColor: 'rgba(123, 104, 238, 1)'
          },
          {
            label: 'Outbound Quantity',
            data: this.chartData.dailyOutboundData,
            // --- NEW MIXED COLORS ---
            borderColor: 'rgba(0, 128, 128, 1)', // Teal
            backgroundColor: 'rgba(0, 128, 128, 0.4)', // Faded Teal
            // --- END NEW MIXED COLORS ---
            tension: 0.4, // Smoother lines
            fill: true, // Key property for Area Chart
            pointRadius: 3, // Smaller points for area chart
            pointBackgroundColor: 'rgba(0, 128, 128, 1)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantity'
            },
            min: 0,
            max: yAxisMax,
            ticks: {
              stepSize: 500
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Daily Inbound & Outbound Quantity Trend' // Updated title
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        hover: {
          mode: 'index',
          intersect: false
        }
      }
    });
  }
}
