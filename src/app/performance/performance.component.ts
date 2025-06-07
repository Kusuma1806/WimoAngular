import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { PerformanceMetricsService } from '../performance-metrics.service';
import { Chart } from 'chart.js/auto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-performance',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './performance.component.html',
    styleUrls: ['./performance.component.css']
})
export class PerformanceComponent implements OnInit, AfterViewInit {
    @ViewChild('performanceChart', { static: false }) performanceChart!: ElementRef;
    private chartInstance!: Chart;

    metrics: any[] = [];
    filteredMetrics: any[] = [];
    pagedMetrics: any[] = [];

    selectedType: string = 'Turnover';
    showTable: boolean = false;

    // Pagination properties
    pageSize: number = 5;
    currentPage: number = 1;
    totalPages: number = 1;

    // Date filter properties
    startDate: string = '';
    endDate: string = '';

    // Define a palette of 5 distinct colors
    private readonly colorPalette: string[] = [
        '#FF6384', // Red
        '#36A2EB', // Blue
        '#FFCE56', // Yellow
        '#4BC0C0', // Teal
        '#9966FF'  // Purple
    ];

    constructor(private performanceService: PerformanceMetricsService, private router: Router) {}

    ngOnInit(): void {
        this.loadMetrics();
        this.initializeDateFilters();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            console.log('🚀 Checking Canvas Element:', this.performanceChart?.nativeElement);

            if (!this.showTable && this.performanceChart?.nativeElement) {
                this.createChart();
            } else if (!this.performanceChart?.nativeElement) {
                console.error('❌ Canvas element not found!');
            }
        }, 500);
    }

    initializeDateFilters(): void {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        this.endDate = today.toISOString().split('T')[0];
        this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
    }

    loadMetrics(): void {
        this.performanceService.getMetricsByType(this.selectedType).subscribe({
            next: (data) => {
                console.log('✅ Raw Metrics Data:', data);
                this.metrics = data;
                this.currentPage = 1;
                this.applyFiltersAndPagination();
            },
            error: (err) => console.error('❌ Error fetching metrics:', err)
        });
    }

    triggerCalculation(): void {
        this.performanceService.calculateMetrics().subscribe({
            next: () => {
                console.log('✅ Metrics calculation triggered');
                this.loadMetrics();
            },
            error: (err) => console.error('❌ Error triggering calculation:', err)
        });
    }

    applyFiltersAndPagination(): void {
        let tempMetrics = [...this.metrics];

        if (this.startDate || this.endDate) {
            tempMetrics = tempMetrics.filter(metric => {
                const metricDate = new Date(metric.timestamp);
                const start = this.startDate ? new Date(this.startDate) : null;
                const end = this.endDate ? new Date(this.endDate) : null;

                if (start && metricDate < start) {
                    return false;
                }
                if (end) {
                    const endOfDay = new Date(end);
                    endOfDay.setDate(endOfDay.getDate() + 1);
                    if (metricDate >= endOfDay) {
                        return false;
                    }
                }
                return true;
            });
        }
        this.filteredMetrics = tempMetrics;

        this.totalPages = Math.ceil(this.filteredMetrics.length / this.pageSize);
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        } else if (this.totalPages === 0) {
            this.currentPage = 1;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.pagedMetrics = this.filteredMetrics.slice(startIndex, endIndex);

        if (!this.showTable) {
            this.updateChartData();
        }
        console.log('✅ Filters & Pagination Applied. Current Page:', this.currentPage, 'Total Pages:', this.totalPages, 'Paged Metrics:', this.pagedMetrics.length);
        console.log('Filtered Metrics for chart:', this.filteredMetrics.length);
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.applyFiltersAndPagination();
        }
    }

    updateChartData(): void {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = undefined as any;
        }

        if (this.filteredMetrics.length > 0 && !this.showTable) {
            this.createChart();
        } else if (this.filteredMetrics.length === 0 && !this.showTable) {
             console.warn('⚠ No metrics available for chart update after filtering.');
        }
    }

    createChart(): void {
        if (!this.performanceChart || !this.performanceChart.nativeElement) {
            console.error('❌ Canvas element not found for chart creation!');
            return;
        }

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // Helper function to add transparency to a hex color
        const addAlpha = (color: string, alpha: number): string => {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        this.chartInstance = new Chart(this.performanceChart.nativeElement, {
            type: 'line',
            data: {
                labels: this.filteredMetrics.map(m => new Date(m.timestamp).toLocaleString()),
                datasets: [{
                    label: this.selectedType,
                    data: this.filteredMetrics.map(m => m.value),
                    // Apply repeating semi-transparent colors to the background fill
                    backgroundColor: this.filteredMetrics.map((_, i) =>
                        addAlpha(this.colorPalette[i % this.colorPalette.length], 0.2) // 20% opacity
                    ),
                    // Line color remains a single color for consistency or can also be mapped if desired
                    borderColor: '#007bff', // You can also map this to `colorPalette` if you want the line segments to change color
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 5,
                    pointBackgroundColor: this.filteredMetrics.map((_, i) => this.colorPalette[i % this.colorPalette.length]),
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Timestamp'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        title: {
                            display: true,
                            text: 'Metric Value'
                        }
                    }
                }
            }
        });
        console.log('✅ Chart created/updated.');
    }

    toggleView(): void {
        this.showTable = !this.showTable;

        if (!this.showTable) {
            setTimeout(() => {
                this.updateChartData();
            }, 50);
        }
    }
}