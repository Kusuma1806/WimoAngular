import { Component, OnInit } from '@angular/core';
import { Stock, StockService } from '../stock.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ZoneService } from '../zone.service';
import { VendorService } from '../vendor.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule,MatIconModule,MatButtonModule],
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.css']
})
export class StocksComponent implements OnInit {
  stocks: Stock[] = []; // Stores all stock items
  filteredStocks: Stock[] = []; // Stores search/filter-applied stocks (before pagination)
  pagedStocks: Stock[] = []; // Stocks currently displayed on the current page (for both table and cards)

  searchQuery: string = '';
  currentPage = 1;
  itemsPerPage = 8; // Adjust as needed, e.g., 8 for 2 rows of 4 cards
  totalPages: number = 0;

  showCreateForm = false;
  newStock: Stock = new Stock(0, '', '', 0, 0, 0);
  editingStock: Stock | null = null;

  zoneSearchQuery: number = 0;
  vendorSearchQuery: number = 0;

  zones: any[] = [];
  vendors: any[] = [];
  selectedZone: any | null = null;

  showCardView: boolean = true; // Controls which view is active (true for cards, false for table)

  // --- Image mapping for categories (customize these URLs!) ---
  private categoryImages: { [category: string]: string } = {
    'Gadgets': 'Gadgets.jpg',
    'Clothing': 'clothes.jpg',
    'Books': 'books.jpg',
    'Meat': 'meat.jpg',
    'Fruits': 'fruits.jpg',
    'Groceries': 'groceries.jpg',
    'Vegetables': 'vegetables.jpg',
    // Add more categories and their corresponding image paths
  };

  constructor(
    private stockService: StockService,
    private router: Router,
    private zoneService: ZoneService,
    private vendorService: VendorService
  ) {}

  ngOnInit(): void {
    this.loadStocks();
    this.loadZones();
    this.loadVendors();
  }

  loadStocks(): void {
    this.stockService.getStockItems().subscribe(
      data => {
        this.stocks = data;
        this.currentPage = 1;
        this.applyFilters(); // Apply initial filters and pagination
      },
      error => console.error('❌ Error fetching stocks:', error)
    );
  }

  loadZones(): void {
    this.zoneService.getZones().subscribe({
      next: (data) => {
        this.zones = data;
      },
      error: (err) => console.error('❌ Error fetching zones:', err)
    });
  }

  loadVendors(): void {
    this.vendorService.getVendors().subscribe({
      next: (data) => {
        this.vendors = data;
      },
      error: (err) => console.error('❌ Error fetching vendors:', err)
    });
  }

  searchStocks(): void {
    this.currentPage = 1; // Reset pagination for new search
    this.applyFilters();
  }

  searchByVendor(vendorId: number): void {
    this.vendorSearchQuery = vendorId;
    this.currentPage = 1;
    this.applyFilters();
  }

  searchByZone(zoneId: number): void {
    this.zoneSearchQuery = zoneId;
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let tempFiltered = [...this.stocks]; // Start with all stocks

    // Apply global search query (includes category for search)
    if (this.searchQuery) {
      const lowerCaseQuery = this.searchQuery.toLowerCase();
      tempFiltered = tempFiltered.filter(stock =>
        stock.stockName.toLowerCase().includes(lowerCaseQuery) ||
        stock.stockCategory.toLowerCase().includes(lowerCaseQuery) || // This is where category search happens
        stock.zoneId.toString().includes(lowerCaseQuery) ||
        stock.vendorId.toString().includes(lowerCaseQuery)
      );
    }

    // Apply vendor filter
    if (this.vendorSearchQuery && this.vendorSearchQuery !== 0) {
      tempFiltered = tempFiltered.filter(stock => stock.vendorId === this.vendorSearchQuery);
    }

    // Apply zone filter
    if (this.zoneSearchQuery && this.zoneSearchQuery !== 0) {
      tempFiltered = tempFiltered.filter(stock => stock.zoneId === this.zoneSearchQuery);
    }

    this.filteredStocks = tempFiltered; // Update filteredStocks
    this.calculatePagination();
    this.paginateStocks(); // <--- CRITICAL: Now only paginate
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredStocks.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1;
    }
  }

  paginateStocks(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedStocks = this.filteredStocks.slice(startIndex, endIndex); // Get current page's stocks
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateStocks(); // <--- CRITICAL: Now only paginate
    }
  }

  // --- Create Stock Form and Modal ---
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.editingStock = null;
    if (this.showCreateForm) {
      this.newStock = new Stock(0, '', '', 0, 0, 0);
    }
  }

  onZoneChange(zoneId: number): void {
    this.selectedZone = this.zones.find(zone => zone.zoneId === zoneId) || null;
  }

  createStock(): void {
    this.newStock.zoneId = Number(this.newStock.zoneId);
    this.newStock.vendorId = Number(this.newStock.vendorId);
    this.newStock.stockQuantity = Number(this.newStock.stockQuantity);

    this.stockService.createStock(this.newStock).subscribe(
      response => {
        console.log("✅ Stock created successfully:", response);
        alert(response);
        this.loadStocks();
        this.toggleCreateForm();
      },
      error => {
        console.error("❌ Error creating stock:", error);
      }
    );
  }

  // --- Edit/Update Stock ---
  editStock(stock: Stock): void {
    this.editingStock = { ...stock };
    this.showCreateForm = false;
  }

  updateStock(): void {
    if (this.editingStock) {
      this.stockService.updateStock(this.editingStock).subscribe(
        response => {
          console.log("✅ Stock updated successfully:", response);
          alert('Stock updated successfully!');
          this.loadStocks();
          this.cancelEdit();
        },
        error => {
          console.error("❌ Error updating stock:", error);
          alert('Error updating stock: ' + (error.error || error.message));
        }
      );
    }
  }

  cancelEdit(): void {
    this.editingStock = null;
  }

  // --- Delete Stock ---
  deleteStock(stock: Stock): void {
    if (confirm(`Are you sure you want to delete ${stock.stockName} (ID: ${stock.stockId})?`)) {
      this.stockService.deleteStock(stock.stockId).subscribe(
        response => {
          console.log("✅ Stock deleted successfully:", response);
          alert(response);
          this.loadStocks();
        },
        error => {
          console.error("❌ Error deleting stock:", error);
          alert('Error deleting stock: ' + (error.error || error.message));
        }
      );
    }
  }

  toggleView(isCardView: boolean): void {
    this.showCardView = isCardView;
    this.currentPage = 1; // Reset page when switching views
    this.applyFilters(); // Re-apply filters to ensure data for the new view starts from page 1
  }

  // This method remains, as it's used for the image
  getStockImage(category: string): string {
    const imageUrl = this.categoryImages[category];
    if (imageUrl) {
      return imageUrl;
    }
    return this.categoryImages['Default'] || 'assets/images/default.jpg';
  }
}