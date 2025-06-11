// src/app/zone-charts/zone-charts.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Zone, ZoneService } from '../zone.service';
import Chart from 'chart.js/auto';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-zone-charts',
  standalone: true,
  imports: [CommonModule, MatCard, MatCardContent, MatCardTitle, MatCardHeader],
  templateUrl: './zone-charts.component.html',
  styleUrls: ['./zone-charts.component.css']
})
export class ZoneChartsComponent implements OnInit, AfterViewInit, OnDestroy {
  zones: Zone[] = []; // Holds the fetched zone data

  @ViewChild('overallDonutCanvas') overallDonutCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('utilizationBarCanvas') utilizationBarCanvas!: ElementRef<HTMLCanvasElement>;

  private overallDonutChart: Chart | undefined;
  private utilizationBarChart: Chart | undefined;
  private destroy$ = new Subject<void>(); // RxJS Subject for managing subscriptions

  constructor(private zoneService: ZoneService) {
    console.log('ZoneChartsComponent: Constructor called.');
  }

  ngOnInit(): void {
    console.log('ZoneChartsComponent: ngOnInit called. Fetching zones...');
    // Load zone data when the component initializes
    this.loadZonesForCharts();
  }

  ngAfterViewInit(): void {
    console.log('ZoneChartsComponent: ngAfterViewInit called. Initializing charts...');
    // Initialize the Chart.js instances after the view is ready
    this.initializeCharts();
    // Process and update chart data immediately if zones are already loaded (e.g., from cache)
    // or when they load via the subscription in loadZonesForCharts
    this.processChartData();
    console.log('ZoneChartsComponent: ngAfterViewInit complete.');
  }

  ngOnDestroy(): void {
    console.log('ZoneChartsComponent: ngOnDestroy called. Destroying charts...');
    // Signal to all ongoing subscriptions to unsubscribe
    this.destroy$.next();
    this.destroy$.complete();

    // Destroy Chart.js instances to prevent memory leaks
    if (this.overallDonutChart) {
      this.overallDonutChart.destroy();
    }
    if (this.utilizationBarChart) {
      this.utilizationBarChart.destroy();
    }
    console.log('ZoneChartsComponent: Charts destroyed.');
  }

  /**
   * Fetches zone data from the ZoneService and updates the charts.
   */
  private loadZonesForCharts(): void {
    this.zoneService.getZones()
      .pipe(takeUntil(this.destroy$)) // Automatically unsubscribe when component is destroyed
      .subscribe(
        data => {
          this.zones = data; // Assign fetched data to the zones array
          console.log('ZoneChartsComponent: Zones fetched for charts:', this.zones);
          this.processChartData(); // Process data and update charts once data is loaded
        },
        error => {
          console.error('ZoneChartsComponent: Error fetching zones for charts:', error);
          // Implement user-friendly error handling here (e.g., display a message)
        }
      );
  }

  /**
   * Initializes both the overall donut chart and the utilization bar chart.
   * This sets up the chart structure but initially with empty or default data.
   */
  private initializeCharts(): void {
    console.log('initializeCharts(): Attempting to get canvas contexts...');

    // Initialize Overall Capacity Donut Chart
    if (this.overallDonutCanvas && this.overallDonutCanvas.nativeElement) {
      const ctx = this.overallDonutCanvas.nativeElement.getContext('2d');
      if (ctx) {
        console.log('initializeCharts(): Initializing overallDonutChart...');
        this.overallDonutChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Stored Capacity', 'Available Capacity'],
            datasets: [{
              data: [0, 0], // Initial data will be updated by processChartData
              backgroundColor: ['#4CAF50', '#2196F3'], // Green for stored, Blue for available
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

    // Initialize Zone Utilization Bar Chart
    if (this.utilizationBarCanvas && this.utilizationBarCanvas.nativeElement) {
      const ctx = this.utilizationBarCanvas.nativeElement.getContext('2d');
      if (ctx) {
        console.log('initializeCharts(): Initializing utilizationBarChart...');
        this.utilizationBarChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: [], // Initial labels will be updated by processChartData
            datasets: [{
              label: 'Utilization',
              data: [], // Initial data will be updated by processChartData
              backgroundColor: [], // Initial colors will be updated by processChartData
              borderColor: [], // Initial colors will be updated by processChartData
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'x', // Sets the x-axis as the primary axis for bars (vertical bars)
            scales: {
              y: {
                beginAtZero: true,
                max: 100, // Utilization is a percentage, so max is 100
                title: { display: true, text: 'Utilization (%)' }
              },
              x: {
                title: { display: true, text: 'Zone Name' }
              }
            },
            plugins: {
              legend: { display: false }, // No legend needed as colors represent utilization tiers
              tooltip: {
                callbacks: {
                  label: (context) => {
                    let label = context.dataset.label || '';
                    if (label) label += ': ';
                    // For a vertical bar chart (indexAxis: 'x'), the value is on the y-axis
                    if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 2 }).format(context.parsed.y) + '%';
                    }
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

  /**
   * Processes the fetched zone data and updates both charts.
   * This method is called whenever `this.zones` data changes.
   */
  private processChartData(): void {
    console.log('processChartData(): Called.');
    // Ensure charts are initialized before attempting to update them
    if (!this.overallDonutChart || !this.utilizationBarChart) {
      console.warn('processChartData(): Charts not initialized yet. Skipping data processing.');
      return;
    }

    // Handle case where no zone data is available
    if (this.zones.length === 0) {
      console.log('processChartData(): Zones array is empty. Displaying no data message.');
      this.overallDonutChart.data.datasets[0].data = [0, 0]; // Reset donut chart
      this.overallDonutChart.update();
      this.utilizationBarChart.data.labels = []; // Clear bar chart labels
      this.utilizationBarChart.data.datasets[0].data = []; // Clear bar chart data
      this.utilizationBarChart.data.datasets[0].backgroundColor = []; // Clear bar chart colors
      this.utilizationBarChart.data.datasets[0].borderColor = [];
      this.utilizationBarChart.update();
      return;
    }

    // --- Update Overall System Capacity Donut Chart Data ---
    const totalSystemCapacity = this.zones.reduce((sum, zone) => sum + zone.totalCapacity, 0);
    const totalStoredCapacity = this.zones.reduce((sum, zone) => sum + zone.storedCapacity, 0);
    const totalAvailableCapacity = totalSystemCapacity - totalStoredCapacity;
    console.log(`processChartData(): Total System Capacity: ${totalSystemCapacity}, Stored: ${totalStoredCapacity}, Available: ${totalAvailableCapacity}`);

    this.overallDonutChart.data.datasets[0].data = [totalStoredCapacity, totalAvailableCapacity];
    this.overallDonutChart.update(); // Redraw the donut chart

    // --- Update Zone Utilization Bar Chart Data ---
    const zoneNames: string[] = [];
    const utilizationPercentages: number[] = [];
    const backgroundColors: string[] = [];
    const borderColors: string[] = [];

    this.zones.forEach(zone => {
      zoneNames.push(zone.zoneName); // Use zoneName for labels
      // Calculate utilization percentage for each zone
      const utilization = this.getUtilizationPercentage(zone); // Using the dedicated function
      utilizationPercentages.push(parseFloat(utilization.toFixed(2))); // Round to 2 decimal places

      // Determine the color based on utilization
      const color = this.getUtilizationColor(zone); // This is where the color is determined
      backgroundColors.push(color);
      borderColors.push(color); // Border color typically matches background
    });

    console.log('processChartData(): Bar Chart Labels:', zoneNames);
    console.log('processChartData(): Bar Chart Data (Percentages):', utilizationPercentages);
    console.log('processChartData(): Bar Chart Background Colors (Applied):', backgroundColors); // <-- ADDED LOG

    // Assign new data to the bar chart
    this.utilizationBarChart.data.labels = zoneNames;
    this.utilizationBarChart.data.datasets[0].data = utilizationPercentages;
    this.utilizationBarChart.data.datasets[0].backgroundColor = backgroundColors;
    this.utilizationBarChart.data.datasets[0].borderColor = borderColors;
    this.utilizationBarChart.update(); // Redraw the bar chart
  }

  /**
   * Determines the color for a zone's utilization based on predefined thresholds.
   * @param zone The Zone object.
   * @returns A hex color string.
   */
  getUtilizationColor(zone: Zone): string {
    let colorToReturn: string; // Declare a variable to hold the color
    console.log(`getUtilizationColor() for Zone: ${zone.zoneName}, Total Capacity: ${zone.totalCapacity}, Stored Capacity: ${zone.storedCapacity}`); // <-- ADDED LOG

    if (zone.totalCapacity === 0) {
      if (zone.storedCapacity === 0) {
        colorToReturn = '#2196F3'; // Blue for empty/no capacity
        console.log(`  -> Case: totalCapacity=0, storedCapacity=0. Returning: ${colorToReturn}`); // <-- ADDED LOG
        return colorToReturn;
      }
      colorToReturn = '#B00020'; // Red for error/invalid capacity (total is 0, but stored isn't)
      console.log(`  -> Case: totalCapacity=0, storedCapacity>0 (Error). Returning: ${colorToReturn}`); // <-- ADDED LOG
      return colorToReturn;
    }

    const utilization = zone.storedCapacity / zone.totalCapacity;
    console.log(`  -> Utilization calculated: ${utilization}`); // <-- ADDED LOG

    // Special case: if storedCapacity is 0 (and totalCapacity > 0)
    if (zone.storedCapacity === 0) {
      colorToReturn = '#2196F3'; // Blue for genuinely empty zone
      console.log(`  -> Case: storedCapacity=0 (Empty). Returning: ${colorToReturn}`); // <-- ADDED LOG
      return colorToReturn;
    }

    // General utilization thresholds
    if (utilization < 0.5) {
      colorToReturn = '#4CAF50'; // Green for optimal (< 50%)
      console.log(`  -> Case: utilization < 0.5 (Optimal). Returning: ${colorToReturn}`); // <-- ADDED LOG
      return colorToReturn;
    }
    if (utilization >= 0.5 && utilization < 0.8) {
      colorToReturn = '#FFC107'; // Yellow for moderate (50% to < 80%)
      console.log(`  -> Case: utilization >= 0.5 && < 0.8 (Moderate). Returning: ${colorToReturn}`); // <-- ADDED LOG
      return colorToReturn;
    }
    if (utilization >= 0.8 && utilization <= 1.0) {
      colorToReturn = '#F44336'; // Red for high (80% to 100%)
      console.log(`  -> Case: utilization >= 0.8 && <= 1.0 (High). Returning: ${colorToReturn}`); // <-- ADDED LOG
      return colorToReturn;
    }

    // Fallback for unexpected utilization values (e.g., > 1.0)
    colorToReturn = '#9E9E9E'; // Grey for unknown/out of bounds
    console.log(`  -> Case: Fallback (Unknown). Returning: ${colorToReturn}`); // <-- ADDED LOG
    return colorToReturn;
  }

  /**
   * Calculates the utilization percentage for a given zone.
   * @param zone The Zone object.
   * @returns The utilization percentage (0-100). Returns 0 if totalCapacity is 0 to avoid division by zero.
   */
  getUtilizationPercentage(zone: Zone): number {
    if (zone.totalCapacity === 0) return 0; // Prevent division by zero
    return (zone.storedCapacity / zone.totalCapacity) * 100;
  }
}
