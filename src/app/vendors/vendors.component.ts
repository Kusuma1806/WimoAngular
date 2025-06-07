// src/app/vendors/vendors.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core'; // Added OnDestroy
import { Vendor, VendorService } from '../vendor.service';
import { FormsModule, FormControl } from '@angular/forms'; // FormControl is part of ReactiveFormsModule, but often imported separately if not using a full FormGroup
import { CommonModule } from '@angular/common';

// RxJS for reactive programming
import { Subject, Observable } from 'rxjs'; // <<< Added Observable, Subject
import { takeUntil } from 'rxjs/operators'; // <<< Added takeUntil

// Angular Material Imports
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterModule } from '@angular/router';

// <<< Import CommonService to get admin status >>>
import { CommonService } from '../common.service'; 

@Component({
  selector: 'app-vendor',
  standalone: true, // Assuming it's truly standalone from your imports list
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatPaginator, // MatPaginator needs to be imported here if standalone
    // You'll likely need MatToolbarModule, MatProgressBarModule, MatSnackBarModule if they're used in the template
    // as per previous conversation. Adding common ones for robustness.
    // MatToolbarModule,
    // MatProgressBarModule,
    // MatSnackBarModule // if using MatSnackBar
  ],
  templateUrl: './vendors.component.html',
  styleUrls: ['./vendors.component.css']
})
export class VendorsComponent implements OnInit, OnDestroy { // <<< Implemented OnDestroy
  vendors: Vendor[] = [];
  filteredVendors: Vendor[] = [];
  searchQuery: string = '';
  
  // Note: Your HTML uses [(ngModel)]="searchQuery" and (input)="searchVendors()",
  // so `searchTermControl` is not actively used for filtering based on the provided HTML.
  // Kept it as it was in your original snippet, but it's redundant if not tied to the input.
  // searchTermControl = new FormControl(''); 

  pageSize = 3; 
  pageIndex = 0; 
  totalVendors = 0; 

  showCreateForm = false;
  editingVendor: Vendor | null = null;
  newVendor: Vendor = new Vendor(0, '', 0, '');

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // <<< NEW: Observable for admin status >>>
  isAdmin$: Observable<boolean>; 

  // <<< NEW: Subject for RxJS subscription cleanup >>>
  private destroy$ = new Subject<void>(); 

  // <<< Injected CommonService >>>
  constructor(private vendorService: VendorService, private commonService: CommonService) { 
    // Initialize isAdmin$ observable in the constructor
    this.isAdmin$ = this.commonService.isAdmin$;
  }

  ngOnInit(): void {
    // <<< NEW: Subscribe to isAdmin$ for reactive updates >>>
    // This subscription ensures that the component's internal state (even if not explicitly stored)
    // is aware of admin role changes, allowing the `*ngIf="isAdmin$ | async"` in the template to react.
    this.isAdmin$
      .pipe(takeUntil(this.destroy$)) // Ensures subscription is cleaned up when component is destroyed
      .subscribe(isAdminStatus => {
        console.log('VendorsComponent: Admin status updated:', isAdminStatus);
      });
    // <<< END NEW >>>

    this.loadVendors();
  }

  // <<< NEW: ngOnDestroy lifecycle hook for cleanup >>>
  ngOnDestroy(): void {
    // Emit a value to the destroy$ subject to trigger unsubscription for all pipes using takeUntil.
    this.destroy$.next();
    // Complete the subject to prevent further emissions.
    this.destroy$.complete();
  }
  // <<< END NEW >>>

  loadVendors(): void {
    this.vendorService.getVendors().pipe(
      takeUntil(this.destroy$) // <<< NEW: Ensure this subscription is also cleaned up
    ).subscribe(
      data => {
        this.vendors = data;
        this.pageIndex = 0; 
        this.applyFilters();
      },
      error => console.error('Error fetching vendors:', error)
    );
  }

  searchVendors(): void {
    this.pageIndex = 0; 
    this.applyFilters();
  }

  applyFilters(): void {
    const filtered = this.vendors.filter(vendor =>
      vendor.vendorName.toLowerCase().includes(this.searchQuery.toLowerCase())
    );

    this.totalVendors = filtered.length; 

    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredVendors = filtered.slice(startIndex, endIndex);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyFilters();
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.editingVendor = null; 
    this.newVendor = new Vendor(0, '', 0, ''); 
  }

  editVendor(vendor: Vendor): void {
    this.editingVendor = { ...vendor }; 
    this.showCreateForm = false; 
  }

  createVendor(): void {
    this.vendorService.createVendor(this.newVendor).pipe(
      takeUntil(this.destroy$) // <<< NEW: Ensure this subscription is also cleaned up
    ).subscribe(() => {
      this.loadVendors();
      this.showCreateForm = false;
    }, error => console.error('Error creating vendor:', error));
  }

  updateVendor(): void {
    if (this.editingVendor) {
      this.vendorService.updateVendor(this.editingVendor).pipe(
        takeUntil(this.destroy$) // <<< NEW: Ensure this subscription is also cleaned up
      ).subscribe(() => {
        this.loadVendors();
        this.editingVendor = null;
      }, error => console.error('Error updating vendor:', error));
    }
  }

  cancelEdit(): void {
    this.editingVendor = null;
  }

  deleteVendor(vendor: Vendor): void {
    if (confirm(`Are you sure you want to delete ${vendor.vendorName}?`)) {
      this.vendorService.deleteVendor(vendor.vendorId).pipe(
        takeUntil(this.destroy$) // <<< NEW: Ensure this subscription is also cleaned up
      ).subscribe(() => {
        this.loadVendors();
      }, error => console.error('Error deleting vendor:', error));
    }
  }
}
