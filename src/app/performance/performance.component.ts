import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { PerformanceMetricsService } from '../performance-metrics.service';
import {Chart} from 'chart.js/auto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-performance',
  imports: [CommonModule, FormsModule],
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.css']
})
export class PerformanceComponent implements OnInit, AfterViewInit {
  @ViewChild('performanceChart', { static: false}) performanceChart!: ElementRef;
  private chartInstance!: Chart; // ✅ Stores the current chart instance

  metrics: any[] = [];
  selectedType: string = 'Turnover';
  showTable: boolean = false;

  constructor(private performanceService: PerformanceMetricsService,private router:Router) {}

  ngOnInit(): void {
    this.loadMetrics();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      console.log('🚀 Checking Canvas Element:', this.performanceChart?.nativeElement);
  
      if (this.performanceChart?.nativeElement) {
        this.createChart();
      } else {
        console.error('❌ Canvas element not found!');
      }
    }, 500); // ✅ Small delay to ensure ViewChild initializes
  }
  
  loadMetrics(): void {
    this.performanceService.getMetricsByType(this.selectedType).subscribe({
      next: (data) => {
        console.log('✅ Metrics Data:', data);
        this.metrics = data;
        this.updateChartData();
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

  updateChartData(): void {
    if (this.metrics.length > 0) {
      console.log('🚀 Updating Chart Data:', this.metrics);

      if (this.chartInstance) {
        this.chartInstance.destroy(); // ✅ Destroy old chart instance before updating
        this.chartInstance = undefined;
      }

      this.createChart();
    } else {
      console.warn('⚠ No metrics available for chart update.');
    }
  }

  createChart(): void {
    if (!this.performanceChart || !this.performanceChart.nativeElement) {
      console.error('❌ Canvas element not found!');
      return; // ✅ Exit if the canvas is not available
    }
  
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  
    this.chartInstance = new Chart(this.performanceChart.nativeElement, {
      type: 'line',
      data: {
        labels: this.metrics.map(m => new Date(m.timestamp).toLocaleString()),
        datasets: [{
          label: this.selectedType,
          data: this.metrics.map(m => m.value),
          backgroundColor: ['#007bff', '#28a745', '#ffc107'],
          borderColor: '#343a40',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true }
        }
      }
    });
  }
  
  toggleView(): void {
    this.showTable = !this.showTable;
  
    // ✅ If switching to chart view, recreate the chart
    if (!this.showTable) {
      setTimeout(() => {
        this.createChart();
      }, 300); // ✅ Slight delay ensures view rendering is complete
    }
  }
  
}
