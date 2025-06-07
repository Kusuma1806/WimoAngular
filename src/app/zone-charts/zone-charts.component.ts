// src/app/zone-charts/zone-charts.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Zone, ZoneService } from '../zone.service'; // <--- Import ZoneService
import Chart from 'chart.js/auto';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';

import { Subject } from 'rxjs'; // Import Subject for RxJS cleanup
import { takeUntil } from 'rxjs/operators'; // Import takeUntil

@Component({
  selector: 'app-zone-charts',
  standalone: true,
  imports: [CommonModule, MatCard, MatCardContent, MatCardTitle, MatCardHeader],
  templateUrl: './zone-charts.component.html',
  styleUrls: ['./zone-charts.component.css']
})
export class ZoneChartsComponent implements OnInit, AfterViewInit, OnDestroy { // Removed OnChanges
  // @Input() zones: Zone[] = []; // <--- REMOVE THIS LINE

  zones: Zone[] = []; // <--- Declare zones here to hold fetched data

  @ViewChild('overallDonutCanvas') overallDonutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('utilizationBarCanvas') utilizationBarCanvas!: ElementRef<HTMLCanvasElement>;

  private overallDonutChart: Chart | undefined;
  private utilizationBarChart: Chart | undefined;
  private destroy$ = new Subject<void>(); // For RxJS cleanup

  constructor(private zoneService: ZoneService) { // <--- Inject ZoneService
    console.log('ZoneChartsComponent: Constructor called.');
  }

  ngOnInit(): void {
    console.log('ZoneChartsComponent: ngOnInit called. Fetching zones...');
    this.loadZonesForCharts(); // <--- Call new method to load data
  }

  ngAfterViewInit(): void {
    console.log('ZoneChartsComponent: ngAfterViewInit called. Initializing charts...');
    this.initializeCharts();
    // After initialization, update with any already loaded data
    this.processChartData();
    console.log('ZoneChartsComponent: ngAfterViewInit complete.');
  }

  // ngOnChanges(changes: SimpleChanges): void { // <--- REMOVE THIS ENTIRE METHOD
  //   console.log('ZoneChartsComponent: ngOnChanges called.', changes);
  //   if (changes['zones'] && this.zones) {
  //     console.log('ZoneChartsComponent: Zones input changed. Current zones length:', this.zones.length);
  //     this.processChartData();
  //   } else if (changes['zones'] && !this.zones) {
  //     console.log('ZoneChartsComponent: Zones input changed to null/undefined.');
  //   }
  // }

  ngOnDestroy(): void {
    console.log('ZoneChartsComponent: ngOnDestroy called. Destroying charts...');
    this.destroy$.next(); // Emit a value to signal completion
    this.destroy$.complete(); // Complete the subject
    if (this.overallDonutChart) {
      this.overallDonutChart.destroy();
    }
    if (this.utilizationBarChart) {
      this.utilizationBarChart.destroy();
    }
    console.log('ZoneChartsComponent: Charts destroyed.');
  }

  // New method to load zones specifically for this component
  private loadZonesForCharts(): void {
    this.zoneService.getZones()
      .pipe(takeUntil(this.destroy$)) // Ensure subscription is cleaned up
      .subscribe(
        data => {
          this.zones = data;
          console.log('ZoneChartsComponent: Zones fetched for charts:', this.zones);
          this.processChartData(); // Process data once it's loaded
        },
        error => {
          console.error('ZoneChartsComponent: Error fetching zones for charts:', error);
          // Handle error, e.g., display a message in the chart area
        }
      );
  }


  private initializeCharts(): void {
    // ... (rest of initializeCharts method remains the same)
    console.log('initializeCharts(): Attempting to get canvas contexts...');
    if (this.overallDonutCanvas && this.overallDonutCanvas.nativeElement) {
      const ctx = this.overallDonutCanvas.nativeElement.getContext('2d');
      if (ctx) {
        console.log('initializeCharts(): Initializing overallDonutChart...');
        this.overallDonutChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Stored Capacity', 'Available Capacity'],
            datasets: [{
              data: [0, 0],
              backgroundColor: ['#4CAF50', '#2196F3'],
              hoverBackgroundColor: ['#66BB6A', '#42A5F5']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true, position: 'right' },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    let label = context.label || '';
                    if (label) label += ': ';
                    if (context.parsed) label += new Intl.NumberFormat('en-US', { style: 'decimal' }).format(context.parsed) + ' units';
                    return label;
                  }
                }
              }
            }
          }
        });
        console.log('initializeCharts(): overallDonutChart initialized.');
      } else {
        console.error('initializeCharts(): Failed to get 2D context for overallDonutCanvas.');
      }
    } else {
      console.warn('initializeCharts(): overallDonutCanvas element not found or not native element.');
    }

    if (this.utilizationBarCanvas && this.utilizationBarCanvas.nativeElement) {
      const ctx = this.utilizationBarCanvas.nativeElement.getContext('2d');
      if (ctx) {
        console.log('initializeCharts(): Initializing utilizationBarChart...');
        this.utilizationBarChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: [],
            datasets: [{
              label: 'Utilization',
              data: [],
              backgroundColor: [],
              borderColor: [],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'x',
            scales: {
              y: { beginAtZero: true, max: 100, title: { display: true, text: 'Utilization (%)' } },
              x: { title: { display: true, text: 'Zone Name' } }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    if (context.parsed.x !== null) label += new Intl.NumberFormat('en-US', { style: 'decimal' }).format(context.parsed.x) + '%';
                    return label;
                  }
                }
              }
            }
          }
        });
        console.log('initializeCharts(): utilizationBarChart initialized.');
      } else {
        console.error('initializeCharts(): Failed to get 2D context for utilizationBarCanvas.');
      }
    } else {
      console.warn('initializeCharts(): utilizationBarCanvas element not found or not native element.');
    }
  }


  private processChartData(): void {
    console.log('processChartData(): Called.');
    if (!this.overallDonutChart || !this.utilizationBarChart) {
      console.warn('processChartData(): Charts not initialized yet. Skipping data processing.');
      return;
    }
    if (this.zones.length === 0) {
      console.log('processChartData(): Zones array is empty. Displaying no data message.');
      this.overallDonutChart.data.datasets[0].data = [0, 0];
      this.overallDonutChart.update();
      this.utilizationBarChart.data.labels = [];
      this.utilizationBarChart.data.datasets[0].data = [];
      this.utilizationBarChart.update();
      return;
    }

    // --- Overall System Capacity Donut Chart Data ---
    const totalSystemCapacity = this.zones.reduce((sum, zone) => sum + zone.totalCapacity, 0);
    const totalStoredCapacity = this.zones.reduce((sum, zone) => sum + zone.storedCapacity, 0);
    const totalAvailableCapacity = totalSystemCapacity - totalStoredCapacity;
    console.log(`processChartData(): Total System Capacity: ${totalSystemCapacity}, Stored: ${totalStoredCapacity}, Available: ${totalAvailableCapacity}`);

    this.overallDonutChart.data.datasets[0].data = [totalStoredCapacity, totalAvailableCapacity];
    this.overallDonutChart.update();

    // --- Zone Utilization Bar Chart Data ---
    const zoneNames: string[] = [];
    const utilizationPercentages: number[] = [];
    const backgroundColors: string[] = [];
    const borderColors: string[] = [];

    this.zones.forEach(zone => {
      zoneNames.push(zone.zoneName);
      const utilization = zone.totalCapacity > 0 ? (zone.storedCapacity / zone.totalCapacity) * 100 : 0;
      utilizationPercentages.push(parseFloat(utilization.toFixed(2)));

      const color = this.getUtilizationColor(zone);
      backgroundColors.push(color);
      borderColors.push(color);
    });
    console.log('processChartData(): Bar Chart Labels:', zoneNames);
    console.log('processChartData(): Bar Chart Data:', utilizationPercentages);

    this.utilizationBarChart.data.labels = zoneNames;
    this.utilizationBarChart.data.datasets[0].data = utilizationPercentages;
    this.utilizationBarChart.data.datasets[0].backgroundColor = backgroundColors;
    this.utilizationBarChart.data.datasets[0].borderColor = borderColors;
    this.utilizationBarChart.update();
  }

  getUtilizationColor(zone: Zone): string {
    // ... (Your existing getUtilizationColor logic - remains the same)
    if (zone.totalCapacity === 0) {
      if (zone.storedCapacity === 0) return '#2196F3'; // Blue for empty/no capacity
      return '#B00020'; // Red for error/invalid capacity
    }
    const utilization = zone.storedCapacity / zone.totalCapacity;
    if (zone.storedCapacity === 0) return '#2196F3'; // Blue for empty
    if (utilization < 0.5) return '#4CAF50'; // Green for optimal
    if (utilization >= 0.5 && utilization < 0.8) return '#FFC107'; // Yellow for moderate
    if (utilization >= 0.8 && utilization <= 1.0) return '#F44336'; // Red for high
    return '#9E9E9E'; // Grey for unknown
  }
}