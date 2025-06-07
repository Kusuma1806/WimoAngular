import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
import { CommonService } from '../common.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  imports:[CommonModule, RouterLink, RouterOutlet, RouterModule, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnDestroy {
  isAdmin$: Observable<boolean>;

  showLogoutModal: boolean = false;
  logoutMessage: string = '';

  private destroy$ = new Subject<void>();

  constructor(private router: Router, private commonService: CommonService) {
    this.isAdmin$ = this.commonService.isAdmin$;

    this.commonService.logoutMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {

        if (message) {
          this.logoutMessage = message;
          this.showLogoutModal = true;
        } else {
          this.showLogoutModal = false;
        }
      });
  }

  get isLoggedIn(): boolean {
    if (this.commonService.getToken()) {
      return true;
    } else {
      return this.commonService.logStatus(); 
    }
  }

  logout(): void {
    this.commonService.initiateLogoutConfirmation(); 
  }

  confirmLogout(): void {
    this.showLogoutModal = false; // Hide the modal
    this.commonService.performLogout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}