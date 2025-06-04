// src/app/zones/zones.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core'; // Added OnDestroy
import { Zone, ZoneService } from '../zone.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms'; // Added ReactiveFormsModule, FormControl

// RxJS for debounce and teardown
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

// Angular Material Imports
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs'; // For the tabbed view
import { MatMenuModule } from '@angular/material/menu'; // For the actions menu
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // For the donut chart effect
import { MatToolbarModule } from '@angular/material/toolbar'; // NEW: For the header toolbar
import { MatProgressBarModule } from '@angular/material/progress-bar'; // NEW: For linear loading bar
import { MatChipsModule } from '@angular/material/chips'; // NEW: For status chips

@Component({
  selector: 'app-zone',
  standalone: true, // Assuming it's truly standalone from your imports list
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule, // NEW: Needed for FormControl
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatPaginator,
    MatTabsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatToolbarModule,      // NEW
    MatProgressBarModule,  // NEW
    MatChipsModule         // NEW
  ],
  templateUrl: './zones.component.html',
  styleUrls: ['./zones.component.css']
})
export class ZoneComponent implements OnInit, OnDestroy { // Added OnDestroy
  zones: Zone[] = [];
  filteredZones: Zone[] = [];
  searchTermControl = new FormControl(''); // Using FormControl for search

  pageSize = 3;
  pageIndex = 0;
  totalZones = 0;

  showCreateForm = false;
  newZone: Zone = new Zone(0, '', 0, 0);
  editingZone: Zone | null = null;

  activeTabFilter: 'all' | 'low' | 'moderate' | 'high' = 'all';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  isLoading: boolean = false; // Loading indicator
  private destroy$ = new Subject<void>(); // For unsubscribing RxJS observables

  constructor(private zoneService: ZoneService) {}

  ngOnInit(): void {
    this.loadZones();

    // Debounce search input for better performance and reactivity
    this.searchTermControl.valueChanges.pipe(
      debounceTime(300), // Wait 300ms after last keystroke
      distinctUntilChanged(), // Only emit if value is different from previous value
      takeUntil(this.destroy$) // Unsubscribe on component destroy
    ).subscribe(searchTerm => {
      this.pageIndex = 0; // Reset to first page on search
      this.applyFilters();
    });
  }

  // Lifecycle hook to clean up RxJS subscriptions
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadZones(): void {
    this.isLoading = true; // Set loading to true
    this.zoneService.getZones().subscribe(
      data => {
        this.zones = data;
        this.pageIndex = 0; // Reset to first page when data loads or reloads
        this.applyFilters();
        this.isLoading = false; // Set loading to false on success
      },
      error => {
        console.error('Error fetching zones:', error);
        this.isLoading = false; // Set loading to false on error
      }
    );
  }

  applyFilters(): void {
    // 1. Filter by Search Query
    const searchTerm = this.searchTermControl.value?.toLowerCase() || '';
    let tempFiltered = this.zones.filter(zone =>
      // Corrected: Convert zoneId to string before searching
      zone.zoneName.toLowerCase().includes(searchTerm) ||
      String(zone.zoneId).includes(searchTerm)
    );

    // 2. Filter by Active Tab
    tempFiltered = tempFiltered.filter(zone => this.getTabFilterCondition(zone));

    // 3. Apply Pagination
    this.totalZones = tempFiltered.length; // Update total count for paginator

    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredZones = tempFiltered.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyFilters();
  }

  onTabChange(event: any): void {
    const tabLabel = event.tab.textLabel;
    switch (tabLabel) {
      case 'All Zones':
        this.activeTabFilter = 'all';
        break;
      case 'Low Usage':
        this.activeTabFilter = 'low';
        break;
      case 'Moderate Usage':
        this.activeTabFilter = 'moderate';
        break;
      case 'High Usage':
        this.activeTabFilter = 'high';
        break;
      default:
        this.activeTabFilter = 'all';
    }
    this.pageIndex = 0; // Reset to first page on tab change
    this.applyFilters();
  }

  getTabFilterCondition(zone: Zone): boolean {
    const utilization = zone.totalCapacity > 0 ? (zone.storedCapacity / zone.totalCapacity) : 0;

    switch (this.activeTabFilter) {
      case 'all':
        return true;
      case 'low': // Less than 50% utilized AND not completely empty (to avoid empty zones in low usage unless desired)
        return utilization < 0.5 && zone.storedCapacity > 0;
      case 'moderate': // 50% to less than 80% utilized
        return utilization >= 0.5 && utilization < 0.8;
      case 'high': // 80% or more utilized
        return utilization >= 0.8;
      default:
        return true;
    }
  }

  // Helper to get available percentage for the progress spinner
  getAvailablePercentage(zone: Zone): number {
    if (zone.totalCapacity === 0) return 0;
    return ((zone.totalCapacity - zone.storedCapacity) / zone.totalCapacity) * 100;
  }

  // Helper to get utilization percentage for the linear progress bar
  getUtilizationPercentage(zone: Zone): number {
    if (zone.totalCapacity === 0) return 0;
    return (zone.storedCapacity / zone.totalCapacity) * 100;
  }

  // Helper to determine the color for the progress spinner AND linear progress bar
  getUtilizationColor(zone: Zone): string {
    if (zone.totalCapacity === 0) {
      if (zone.storedCapacity === 0) return '#2196F3'; // Blue for empty/no capacity
      return '#B00020'; // Dark red for error (stored but no total capacity)
    }
    const utilization = zone.storedCapacity / zone.totalCapacity;
    if (zone.storedCapacity === 0) return '#2196F3'; // Blue (Empty)
    if (utilization < 0.5) return '#4CAF50'; // Green (Optimal)
    if (utilization >= 0.5 && utilization < 0.8) return '#FFC107'; // Yellow (Moderate)
    if (utilization >= 0.8 && utilization <= 1.0) return '#F44336'; // Red (High)
    return '#9E9E9E'; // Grey fallback
  }

  // Helper to get the status text for the chip
  getZoneStatus(zone: Zone): string {
    if (zone.totalCapacity === 0) {
      if (zone.storedCapacity === 0) return 'Empty / No Capacity';
      return 'Error (Invalid Capacity)';
    }
    const utilization = zone.storedCapacity / zone.totalCapacity;
    if (zone.storedCapacity === 0) return 'Empty';
    if (utilization < 0.5) return 'Optimal';
    if (utilization >= 0.5 && utilization < 0.8) return 'Moderate';
    if (utilization >= 0.8 && utilization <= 1.0) {
      if (utilization === 1.0) return 'Full';
      return 'High';
    }
    return 'Unknown';
  }

  // Helper to get the Material color for the status chip
  getStatusColor(status: string): 'primary' | 'accent' | 'warn' | '' {
    switch (status) {
      case 'Optimal':
      case 'Empty':
        return 'primary';
      case 'Moderate':
        return 'accent';
      case 'High':
      case 'Error (Invalid Capacity)':
        return 'warn';
      case 'Full':
        return 'primary'; // Could be 'warn' if full is critical, or 'primary' if full is a goal. Choose based on UX.
      default:
        return ''; // Default Material theme color
    }
  }

  // Clear search input
  clearSearch(): void {
    this.searchTermControl.setValue('');
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.editingZone = null; // Ensure editing form is closed
    this.newZone = new Zone(0, '', 0, 0); // Reset new zone form fields
  }

  editZone(zone: Zone): void {
    this.editingZone = { ...zone }; // Create a copy to prevent direct mutation
    this.showCreateForm = false; // Close create form if open
  }

  createZone(): void {
    this.zoneService.createZone(this.newZone).subscribe(() => {
      this.loadZones();
      this.showCreateForm = false;
    }, error => console.error('Error creating zone:', error));
  }

  updateZone(): void {
    if (this.editingZone) {
      this.zoneService.updateZone(this.editingZone).subscribe(() => {
        this.loadZones();
        this.editingZone = null;
      }, error => console.error('Error updating zone:', error));
    }
  }

  cancelEdit(): void {
    this.editingZone = null;
  }

  delete(zone: Zone): void {
    if (confirm(`Are you sure you want to delete ${zone.zoneName}?`)) {
      this.zoneService.deleteZone(zone.zoneId).subscribe(() => {
        this.loadZones();
      }, error => console.error('Error deleting zone:', error));
    }
  }
}