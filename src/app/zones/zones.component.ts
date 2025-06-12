// src/app/zones/zones.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Zone, ZoneService } from '../zone.service';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, NgForm } from '@angular/forms'; // Import NgForm

// RxJS for debounce and teardown
import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

// Angular Material Imports
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';

// Import CommonService
import { CommonService } from '../common.service';

@Component({
  selector: 'app-zone',
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    FormsModule, // Keep FormsModule for template-driven forms
    RouterModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule, // Keep this for searchTermControl if you use it that way
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatPaginator,
    MatTabsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  templateUrl: './zones.component.html',
  styleUrls: ['./zones.component.css']
})
export class ZoneComponent implements OnInit, OnDestroy {
  zones: Zone[] = [];
  filteredZones: Zone[] = [];
  searchTermControl = new FormControl('');

  pageSize = 3;
  pageIndex = 0;
  totalZones = 0;

  showCreateForm = false;
  // Initialize newZone based on your Zone model's constructor
  newZone: Zone = new Zone(0, '', 0, 0); // Assuming Zone(id, name, totalCap, storedCap)
  editingZone: Zone | null = null;

  activeTabFilter: 'all' | 'low' | 'moderate' | 'high' = 'all';

  // Properties to hold messages
  successMessage: string | null = null;
  errorMessage: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  // Add ViewChild for each form reference
  @ViewChild('createZoneFormRef') createZoneFormRef!: NgForm;
  @ViewChild('editZoneFormRef') editZoneFormRef!: NgForm;


  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  isAdmin$: Observable<boolean>;

  constructor(private zoneService: ZoneService, private commonService: CommonService) {
    this.isAdmin$ = this.commonService.isAdmin$;
  }

  ngOnInit(): void {
    this.isAdmin$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAdminStatus => {
        console.log('ZonesComponent: Admin status updated:', isAdminStatus);
      });

    this.loadZones();

    this.searchTermControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.pageIndex = 0;
      this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads all zones from the service and applies filtering.
   * Handles loading state and error messages.
   */
  loadZones(): void {
    this.isLoading = true;
    this.zoneService.getZones().pipe(
      takeUntil(this.destroy$) // Ensure cleanup
    ).subscribe({
      next: data => {
        console.log('Zones received from service:', data);
        this.zones = data;
        this.pageIndex = 0;
        this.applyFilters();
        this.isLoading = false;
      },
      error: err => {
        console.error('Error fetching zones:', err);
        this.isLoading = false;
        this.setErrorMessage('Failed to load zones. Please try again.');
      }
    });
  }

  applyFilters(): void {
    const searchTerm = this.searchTermControl.value?.toLowerCase() || '';
    let tempFiltered = this.zones.filter(zone =>
      zone.zoneName.toLowerCase().includes(searchTerm) ||
      String(zone.zoneId).includes(searchTerm)
    );

    tempFiltered = tempFiltered.filter(zone => this.getTabFilterCondition(zone));

    this.totalZones = tempFiltered.length;

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
    this.pageIndex = 0;
    this.applyFilters();
  }

  getTabFilterCondition(zone: Zone): boolean {
    const utilization = zone.totalCapacity > 0 ? (zone.storedCapacity / zone.totalCapacity) : 0;

    switch (this.activeTabFilter) {
      case 'all':
        return true;
      case 'low':
        return utilization < 0.5 && zone.storedCapacity > 0;
      case 'moderate':
        return utilization >= 0.5 && utilization < 0.8;
      case 'high':
        return utilization >= 0.8;
      default:
        return true;
    }
  }

  getAvailablePercentage(zone: Zone): number {
    if (zone.totalCapacity === 0) return 0;
    return ((zone.totalCapacity - zone.storedCapacity) / zone.totalCapacity) * 100;
  }

  getUtilizationPercentage(zone: Zone): number {
    if (zone.totalCapacity === 0) return 0;
    return (zone.storedCapacity / zone.totalCapacity) * 100;
  }

  getUtilizationColor(zone: Zone): string {
    if (zone.totalCapacity === 0) {
      if (zone.storedCapacity === 0) return '#2196F3';
      return '#B00020';
    }
    const utilization = zone.storedCapacity / zone.totalCapacity;
    if (zone.storedCapacity === 0) return '#2196F3';
    if (utilization < 0.5) return '#4CAF50';
    if (utilization >= 0.5 && utilization < 0.8) return '#FFC107';
    if (utilization >= 0.8 && utilization <= 1.0) return '#F44336';
    return '#9E9E9E';
  }

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
        return 'primary'; // Or another color like 'success' if you define one
      default:
        return '';
    }
  }

  clearSearch(): void {
    this.searchTermControl.setValue('');
  }

  /**
   * Toggles the visibility of the create zone form.
   * Resets the newZone object and clears any existing messages.
   */
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.editingZone = null; // Ensure not in edit mode
    this.newZone = new Zone(0, '', 0, 0); // Reset for a new entry
    if (this.createZoneFormRef) { // Reset form state if it exists
      this.createZoneFormRef.resetForm();
    }
    this.clearMessages(); // Clear messages when toggling form
  }

  /**
   * Sets the selected zone for editing.
   * @param zone The zone object to be edited.
   */
  editZone(zone: Zone): void {
    this.editingZone = { ...zone }; // Create a copy to avoid direct mutation
    this.showCreateForm = false; // Hide create form if it's open
    this.clearMessages(); // Clear messages when entering edit mode
  }

  /**
   * Creates a new zone.
   * Includes client-side validation and displays messages.
   * @param form The NgForm instance representing the create zone form.
   */
  createZone(form: NgForm): void {
    this.clearMessages(); // Clear previous messages
    if (form.invalid) {
      this.setErrorMessage('Please correct the form errors before submitting.');
      // Mark all controls as dirty/touched to show errors immediately
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsDirty();
        form.controls[key].markAsTouched();
      });
      return;
    }

    // Additional custom validation logic (as you had before)
    if (this.newZone.totalCapacity <= 0) {
      this.setErrorMessage('Total Capacity must be positive.');
      this.showCreateForm = false;
      return;
    }
    if (this.newZone.storedCapacity < 0) {
      this.setErrorMessage('Stored Capacity cannot be negative.');
      this.showCreateForm = false;
      return;
    }
    if (this.newZone.storedCapacity > this.newZone.totalCapacity) {
        this.setErrorMessage('Stored Capacity cannot exceed Total Capacity.');
        this.showCreateForm = false;
        return;
    }

    this.zoneService.createZone(this.newZone).pipe(
      takeUntil(this.destroy$) // Ensure cleanup
    ).subscribe({
      next: () => {
        this.loadZones(); // Reload zones after successful creation
        this.toggleCreateForm(); // Close form on success (and resets it)
        this.setSuccessMessage('Zone created successfully!');
      },
      error: err => {
        console.error('Error creating zone:', err);
        const errorMessage = this.getErrorMessage(err, 'Failed to create zone.');
        this.setErrorMessage(errorMessage);
        // this.toggleCreateForm(); // Keep form open on error, or close it
      }
    });
  }

  /**
   * Updates an existing zone.
   * Includes client-side validation and displays messages.
   * @param form The NgForm instance representing the edit zone form.
   */
  updateZone(form: NgForm): void {
    this.clearMessages(); // Clear previous messages
    if (!this.editingZone || !this.editingZone.zoneId) {
      this.setErrorMessage('No zone selected for update.');
      this.cancelEdit();
      return;
    }

    if (form.invalid) {
      this.setErrorMessage('Please correct the form errors before updating.');
      // Mark all controls as dirty/touched to show errors immediately
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsDirty();
        form.controls[key].markAsTouched();
      });
      return;
    }

    // Additional custom validation logic (as you had before)
    if (this.editingZone.totalCapacity <= 0) {
      this.setErrorMessage('Total Capacity must be positive for update.');
      return;
    }
    if (this.editingZone.storedCapacity < 0) {
      this.setErrorMessage('Stored Capacity cannot be negative for update.');
      return;
    }
    if (this.editingZone.storedCapacity > this.editingZone.totalCapacity) {
        this.setErrorMessage('Stored Capacity cannot exceed Total Capacity for update.');
        return;
    }

    this.zoneService.updateZone(this.editingZone).pipe(
      takeUntil(this.destroy$) // Ensure cleanup
    ).subscribe({
      next: () => {
        this.loadZones(); // Reload zones after successful update
        this.cancelEdit(); // Close form on success (and resets it)
        this.setSuccessMessage('Zone updated successfully!');
      },
      error: err => {
        console.error('Error updating zone:', err);
        const errorMessage = this.getErrorMessage(err, 'Failed to update zone.');
        this.setErrorMessage(errorMessage);
        // this.cancelEdit(); // Keep form open on error, or close it
      }
    });
  }

  /**
   * Cancels the zone editing process.
   * Clears any existing messages.
   */
  cancelEdit(): void {
    this.editingZone = null;
    if (this.editZoneFormRef) { // Reset form state if it exists
      this.editZoneFormRef.resetForm();
    }
    this.clearMessages(); // Clear messages when canceling edit
  }

  /**
   * Deletes a zone after user confirmation.
   * Displays success or error messages.
   * @param zone The zone object to be deleted.
   */
  delete(zone: Zone): void {
    if (confirm(`Are you sure you want to delete ${zone.zoneName}? This action cannot be undone.`)) {
      this.zoneService.deleteZone(zone.zoneId).pipe(
        takeUntil(this.destroy$) // Ensure cleanup
      ).subscribe({
        next: () => {
          this.loadZones(); // Reload zones after successful deletion
          this.setSuccessMessage('Zone deleted successfully!');
        },
        error: err => {
          console.error('Error deleting zone:', err);
          const errorMessage = this.getErrorMessage(err, 'Failed to delete zone.');
          this.setErrorMessage(errorMessage);
        }
      });
    }
  }

  /**
   * Helper to extract error message from HTTP error response.
   * @param error The HTTP error object.
   * @param defaultMessage A fallback message if no specific error message can be extracted.
   * @returns A user-friendly error message string.
   */
  private getErrorMessage(error: any, defaultMessage: string): string {
    if (error && error.error) {
      // If backend sends a string message in error.error
      if (typeof error.error === 'string') {
        try {
          // Attempt to parse if it's a stringified JSON
          const parsedError = JSON.parse(error.error);
          return parsedError.message || defaultMessage;
        } catch (e) {
          // If not JSON, just return the string
          return error.error;
        }
      }
      // If backend sends a JSON object in error.error
      if (error.error.message) {
        return error.error.message;
      }
    } else if (error && error.message) {
      // Standard JavaScript Error object or HttpErrorResponse message
      return error.message;
    }
    return defaultMessage;
  }

  /**
   * Sets the error message and clears it after 5 seconds.
   * @param message The error message to display.
   */
  setErrorMessage(message: string): void {
    this.errorMessage = message;
    this.successMessage = null; // Clear success message if an error occurs
    setTimeout(() => this.errorMessage = null, 5000);
  }

  /**
   * Sets the success message and clears it after 5 seconds.
   * @param message The success message to display.
   */
  setSuccessMessage(message: string): void {
    this.successMessage = message;
    this.errorMessage = null; // Clear error message if a success occurs
    setTimeout(() => this.successMessage = null, 5000);
  }

  /**
   * Clears both success and error messages immediately.
   */
  clearMessages(): void {
    this.successMessage = null;
    this.errorMessage = null;
  }
}