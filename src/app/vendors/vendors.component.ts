// src/app/vendors/vendors.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { Vendor, VendorService } from '../vendor.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Angular Material Imports
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-vendor',
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatPaginator // MatPaginator needs to be imported here if standalone
  ],
  templateUrl: './vendors.component.html',
  styleUrls: ['./vendors.component.css']
})
export class VendorsComponent implements OnInit {
  vendors: Vendor[] = [];
  filteredVendors: Vendor[] = [];
  searchQuery: string = '';

  pageSize = 3; // Corresponds to itemsPerPage
  pageIndex = 0; // Corresponds to currentPage - 1 (MatPaginator is 0-based)
  totalVendors = 0; // Total count of filtered items for MatPaginator

  showCreateForm = false;
  editingVendor: Vendor | null = null;
  newVendor: Vendor = new Vendor(0, '', 0, '');

  @ViewChild(MatPaginator) paginator!: MatPaginator; // Reference to the Material Paginator

  constructor(private vendorService: VendorService) {} // Removed Router as it's not used here

  ngOnInit(): void {
    this.loadVendors();
  }

  loadVendors(): void {
    this.vendorService.getVendors().subscribe(
      data => {
        this.vendors = data;
        this.pageIndex = 0; // Reset to first page when data loads
        this.applyFilters();
      },
      error => console.error('Error fetching vendors:', error)
    );
  }

  searchVendors(): void {
    this.pageIndex = 0; // Reset to first page on search
    this.applyFilters();
  }

  applyFilters(): void {
    const filtered = this.vendors.filter(vendor =>
      vendor.vendorName.toLowerCase().includes(this.searchQuery.toLowerCase())
    );

    this.totalVendors = filtered.length; // Update total count for paginator

    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredVendors = filtered.slice(startIndex, endIndex);
  }

  // Handler for MatPaginator's page event
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyFilters();
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.editingVendor = null; // Ensure editing form is closed
    this.newVendor = new Vendor(0, '', 0, ''); // Reset new vendor form fields
  }

  editVendor(vendor: Vendor): void {
    this.editingVendor = { ...vendor }; // Create a copy to prevent direct mutation
    this.showCreateForm = false; // Close create form if open
  }

  createVendor(): void {
    this.vendorService.createVendor(this.newVendor).subscribe(() => {
      this.loadVendors();
      this.showCreateForm = false;
    }, error => console.error('Error creating vendor:', error));
  }

  updateVendor(): void {
    if (this.editingVendor) {
      this.vendorService.updateVendor(this.editingVendor).subscribe(() => {
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
      this.vendorService.deleteVendor(vendor.vendorId).subscribe(() => {
        this.loadVendors();
      }, error => console.error('Error deleting vendor:', error));
    }
  }
}