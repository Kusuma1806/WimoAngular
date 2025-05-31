import { Component, OnInit } from '@angular/core';
import { Zone, ZoneService } from '../zone.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule} from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-zone',
  imports:[ZoneComponent,CommonModule,FormsModule],
  templateUrl: './zones.component.html',
  styleUrls: ['./zones.component.css']
})
export class ZoneComponent implements OnInit {
  zones: Zone[]=[];
  zoneId!: number;
  zone!: Zone;
  error:any
  showCreateForm = false;
  newZone: Zone = new Zone(0, '', 0, 0); // Initial empty values
  editingZone: Zone | null = null; // Holds selected zone
  

  constructor(private zoneService: ZoneService,private route: ActivatedRoute) {}
  ngOnInit(): void {
    this.loadZones();
  }

  loadZones(): void {
    this.zoneService.getZones().subscribe(
      data => {
        console.log('Fetched Zones:', data); // ✅ Debugging log
        this.zones = data;
      },
      error => {
        console.error('Error fetching zones:', error); // ✅ Debugging error
        this.error = error;
      }
    );
  }
  

  // 👉 Show/Hide Create Zone Form
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.editingZone = null; // Close update form if open
  }

  // 👉 Show Update Form for Editing
  editZone(zone: Zone): void {
    this.editingZone = { ...zone };
    this.showCreateForm = false; // Close create form if open
  }

  // 👉 Create a New Zone
  createZone(): void {
    this.zoneService.createZone(this.newZone).subscribe(() => {
      this.loadZones();
      this.showCreateForm = false; // Hide form after creation
    });
  }

  // 👉 Update Zone
  updateZone(): void {
    if (this.editingZone) {
      this.zoneService.updateZone(this.editingZone).subscribe(updatedZone => {
        console.log('Updated Zone:', updatedZone); // ✅ Debugging step
        this.loadZones(); // Refresh list
        this.editingZone = { ...updatedZone }; // ✅ Keep updated data visible
      });
    }
  }
  

  // 👉 Cancel Editing
  cancelEdit(): void {
    this.editingZone = null;
  }
  delete(zone: Zone): void {
    if (confirm(`Are you sure you want to delete ${zone.zoneName}?`)) {
      this.zoneService.deleteZone(zone.zoneId).subscribe(() => {
        this.loadZones(); // Refresh after deletion
      });
    }
  }
}
