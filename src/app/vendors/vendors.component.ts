// src/app/vendors/vendors.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Vendor, VendorService } from '../vendor.service'; // Assuming Vendor class is exported from here
import { FormsModule, NgForm } from '@angular/forms'; // Import NgForm
import { CommonModule, TitleCasePipe } from '@angular/common';

// RxJS for reactive programming
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material Imports
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterModule } from '@angular/router';

// Import CommonService to get admin status
import { CommonService } from '../common.service';

@Component({
  selector: 'app-vendor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // Keep FormsModule for template-driven forms
    RouterModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatPaginator,
    TitleCasePipe
  ],
  templateUrl: './vendors.component.html', // This will be your HTML with template-driven form updates
  styleUrls: ['./vendors.component.css']
})
export class VendorsComponent implements OnInit, OnDestroy {
  vendors: Vendor[] = [];
  filteredVendors: Vendor[] = [];
  searchQuery: string = '';

  pageSize = 3;
  pageIndex = 0;
  totalVendors = 0;

  showCreateForm = false;
  editingVendor: Vendor | null = null;
  // Initialize newVendor based on your HTML form fields:
  newVendor: Vendor = new Vendor(0, '', 0, '');

  // Properties to hold messages
  successMessage: string | null = null;
  errorMessage: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  // Get references to the NgForm instances
  @ViewChild('createVendorFormRef') createVendorFormRef!: NgForm;
  @ViewChild('editVendorFormRef') editVendorFormRef!: NgForm;


  isAdmin$: Observable<boolean>;

  private destroy$ = new Subject<void>();

  constructor(private vendorService: VendorService, private commonService: CommonService) {
    this.isAdmin$ = this.commonService.isAdmin$;
  }

  ngOnInit(): void {
    this.isAdmin$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAdminStatus => {
        console.log('VendorsComponent: Admin status updated:', isAdminStatus);
      });

    this.loadVendors();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads all vendors from the service and applies filtering.
   * Handles success and error messages.
   */
  loadVendors(): void {
    this.vendorService.getVendors().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: data => {
        this.vendors = data;
        this.pageIndex = 0; // Reset pagination on new data load
        this.applyFilters();
      },
      error: err => {
        console.error('Error fetching vendors:', err);
        this.setErrorMessage('Failed to load vendors. Please try again.');
      }
    });
  }

  /**
   * Triggers filtering of vendors based on the search query.
   */
  searchVendors(): void {
    this.pageIndex = 0; // Reset page index when searching
    this.applyFilters();
  }

  /**
   * Applies current filters (search query) and pagination to the vendors list.
   */
  applyFilters(): void {
    const filtered = this.vendors.filter(vendor =>
      vendor.vendorName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      String(vendor.vendorId).includes(this.searchQuery) || // Allow searching by ID
      (vendor.contactInfo != null && String(vendor.contactInfo).includes(this.searchQuery)) || // Search by number contact
      (vendor.vendorEmail && vendor.vendorEmail.toLowerCase().includes(this.searchQuery.toLowerCase()))
    );

    this.totalVendors = filtered.length;

    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredVendors = filtered.slice(startIndex, endIndex);
  }

  /**
   * Handles page change events from the paginator.
   * @param event The PageEvent object containing new page index and page size.
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyFilters();
  }

  /**
   * Toggles the visibility of the create vendor form.
   * Resets the newVendor object and clears any existing messages.
   */
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.editingVendor = null; // Ensure not in edit mode
    // Re-initialize newVendor based on your HTML form fields:
    this.newVendor = new Vendor(0, '', 0, ''); // Reset the model
    if (this.createVendorFormRef) {
        this.createVendorFormRef.resetForm(); // Reset the form state
    }
    this.clearMessages(); // Clear messages when toggling form
  }

  /**
   * Sets the selected vendor for editing.
   * @param vendor The vendor object to be edited.
   */
  editVendor(vendor: Vendor): void {
    this.editingVendor = { ...vendor }; // Create a copy to avoid direct mutation
    this.showCreateForm = false; // Hide create form if it's open
    this.clearMessages(); // Clear messages when entering edit mode
    // If you need to reset validation state when opening edit, you could do:
    // setTimeout(() => { // Use setTimeout to ensure form is rendered
    //   if (this.editVendorFormRef) {
    //     this.editVendorFormRef.resetForm();
    //   }
    // });
  }

  /**
   * Creates a new vendor.
   * Includes client-side validation using the NgForm's validity.
   * @param form The NgForm instance representing the create vendor form.
   */
  createVendor(form: NgForm): void {
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

    // If form is valid, proceed with service call
    this.vendorService.createVendor(this.newVendor).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loadVendors(); // Reload vendors after successful creation
        this.toggleCreateForm(); // Close form on success
        this.setSuccessMessage('Vendor created successfully!');
      },
      error: err => {
        console.error('Error creating vendor:', err);
        const errorMessage = this.getErrorMessage(err, 'Failed to create vendor.');
        this.setErrorMessage(errorMessage);
        // You might choose to keep the form open on error, or close it:
        // this.toggleCreateForm();
      }
    });
  }

  /**
   * Updates an existing vendor.
   * Includes client-side validation using the NgForm's validity.
   * @param form The NgForm instance representing the edit vendor form.
   */
  updateVendor(form: NgForm): void {
    this.clearMessages(); // Clear previous messages
    if (!this.editingVendor || !this.editingVendor.vendorId) {
      this.setErrorMessage('No vendor selected for update.');
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

    // If form is valid, proceed with service call
    this.vendorService.updateVendor(this.editingVendor).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.loadVendors(); // Reload vendors after successful update
        this.cancelEdit(); // Close form on success
        this.setSuccessMessage('Vendor updated successfully!');
      },
      error: err => {
        console.error('Error updating vendor:', err);
        const errorMessage = this.getErrorMessage(err, 'Failed to update vendor.');
        this.setErrorMessage(errorMessage);
        // You might choose to keep the form open on error, or close it:
        // this.cancelEdit();
      }
    });
  }

  /**
   * Cancels the vendor editing process.
   * Clears any existing messages.
   */
  cancelEdit(): void {
    this.editingVendor = null;
    if (this.editVendorFormRef) {
      this.editVendorFormRef.resetForm(); // Reset the form state
    }
    this.clearMessages(); // Clear messages when canceling edit
  }

  /**
   * Deletes a vendor after user confirmation.
   * Displays success or error messages.
   * @param vendor The vendor object to be deleted.
   */
  deleteVendor(vendor: Vendor): void {
    if (confirm(`Are you sure you want to delete ${vendor.vendorName}? This action cannot be undone.`)) {
      this.vendorService.deleteVendor(vendor.vendorId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadVendors(); // Reload vendors after successful deletion
          this.setSuccessMessage('Vendor deleted successfully!');
        },
        error: err => {
          console.error('Error deleting vendor:', err);
          const errorMessage = this.getErrorMessage(err, 'Failed to delete vendor.');
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