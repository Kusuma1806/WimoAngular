import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs'; 

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  userName = localStorage.getItem("username"); 
  public isLoggedIn = false;

  private isAdminSubject = new BehaviorSubject<boolean>(this.determineIsAdmin());
  isAdmin$: Observable<boolean> = this.isAdminSubject.asObservable();

  private logoutMessageSource = new Subject<string | null>();
  logoutMessage$: Observable<string | null> = this.logoutMessageSource.asObservable();

  constructor(private router: Router) { }

  /**
   * Retrieves the authentication token from session storage.
   * @returns The token string or null if not found.
   */
  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  /**
   * Removes the token from session storage.
   * This is typically called as part of a logout process before full logout.
   * @returns true upon completion.
   */
  removeToken(): boolean {
    sessionStorage.removeItem('token');
    this.isAdminSubject.next(false); 
    return true;
  }

  /**
   * Initiates the logout process by showing a visually appealing message (modal/card).
   * This method emits a message via `logoutMessageSource` that a component can subscribe to
   * and display in a modal. It does NOT perform the actual session clearing or navigation directly.
   * The actual logout logic is handled by `performLogout()` after the user confirms the modal.
   * @returns void, as its primary purpose is to trigger a UI action.
   */
  // <<< THIS METHOD IS NOW CORRECTLY NAMED initiateLogoutConfirmation() >>>
  initiateLogoutConfirmation(): void {
    console.log(`Logout confirmation initiated for user: ${this.userName}`);
    this.logoutMessageSource.next(`Thanks for your Service ${this.userName || 'User'} ❤ `);
  }

  /**
   * Performs the actual logout by clearing session storage and navigating.
   * This method should be called by the component AFTER the user confirms the logout modal.
   * @returns The updated `isLoggedIn` status.
   */
  performLogout(): boolean {
    console.log(`Performing actual logout for user: ${this.userName}`);
    sessionStorage.clear(); 
    this.isLoggedIn = false; 
    this.router.navigate(['/landing']); 
    this.isAdminSubject.next(false); 
    this.logoutMessageSource.next(null); // Clear the message to hide the modal

    return this.isLoggedIn;
  }

  /**
   * Returns the current login status.
   * @returns The `isLoggedIn` boolean.
   */
  logStatus(): boolean {
    return this.isLoggedIn;
  }

  /**
   * Decodes a JWT token payload.
   * @returns The decoded token payload as an object, or null if invalid/not found.
   */
  getTokenPayload(): any | null {
    const token = this.getToken();
    console.log("...........token", token);
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  }

  /**
   * Retrieves the user's role from the JWT token payload.
   * @returns The user's role as a string (e.g., "ADMIN", "USER"), or null if not found.
   */
  getUserRole(): string | null {
    const token = sessionStorage.getItem('token');

    if (!token) {
      console.error('❌ No token found in session storage');
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles ? String(payload.roles) : null;
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      return null;
    }
  }

  /**
   * Determines if the current user has an 'ADMIN' role.
   * @returns True if the user is an admin, false otherwise.
   */
  public determineIsAdmin(): boolean {
    const role = this.getUserRole();
    return role === "ADMIN";
  }

  /**
   * Updates the login status and role status.
   * Should be called after successful login or on app initialization.
   */
  updateLoginStatusAndRoles() {
    this.isLoggedIn = !!this.getToken(); // Updates isLoggedIn based on token presence
    const newAdminStatus = this.determineIsAdmin(); // Re-evaluates admin status
    this.isAdminSubject.next(newAdminStatus); // EMITS THE NEW STATUS to all subscribers
    console.log(`CommonService: Admin status re-evaluated to: ${newAdminStatus}`); // DEBUG LOG
  }
}
