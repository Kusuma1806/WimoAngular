// src/app/zones/zones.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Zone, ZoneService } from '../zone.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';

// RxJS for debounce and teardown
import { Subject, Observable } from 'rxjs'; // <<< Added Observable import
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

// <<< Import CommonService >>>
import { CommonService } from '../common.service'; 

@Component({
  selector: 'app-zone',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
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
  newZone: Zone = new Zone(0, '', 0, 0);
  editingZone: Zone | null = null;

  activeTabFilter: 'all' | 'low' | 'moderate' | 'high' = 'all';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  isLoading: boolean = false;
  private destroy$ = new Subject<void>();

  // <<< NEW: Observable for admin status >>>
  isAdmin$: Observable<boolean>;

  constructor(private zoneService: ZoneService, private commonService: CommonService) { // <<< Injected CommonService
    // Initialize isAdmin$ here; the subscription will happen in ngOnInit
    this.isAdmin$ = this.commonService.isAdmin$;
  }

  ngOnInit(): void {
    // <<< NEW: Subscribe to isAdmin$ to reactively update UI >>>
    this.isAdmin$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAdminStatus => {
        console.log('ZonesComponent: Admin status updated:', isAdminStatus);
        // No direct UI changes here, as the template uses async pipe.
        // This subscription mainly ensures the observable is active.
      });
    // <<< END NEW >>>

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

  loadZones(): void {
    this.isLoading = true;
    this.zoneService.getZones().subscribe(
      data => {
        console.log('Zones received from service:', data);
        this.zones = data;
        this.pageIndex = 0;
        this.applyFilters();
        this.isLoading = false;
      },
      error => {
        console.error('Error fetching zones:', error);
        this.isLoading = false;
      }
    );
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
        return 'primary';
      default:
        return '';
    }
  }

  clearSearch(): void {
    this.searchTermControl.setValue('');
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.editingZone = null;
    this.newZone = new Zone(0, '', 0, 0);
  }

  editZone(zone: Zone): void {
    this.editingZone = { ...zone };
    this.showCreateForm = false;
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
