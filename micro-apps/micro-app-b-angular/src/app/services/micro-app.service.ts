import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

// Simple app data interface
export interface AppData {
  name: string;
  id: string;
  [key: string]: any;
}

/**
 * Simplified MicroApp service that works in both portal and standalone modes
 */
@Injectable({
  providedIn: "root",
})
export class MicroAppService {
  // App data
  private appSubject = new BehaviorSubject<AppData | null>(null);
  public app$ = this.appSubject.asObservable();

  // Initialization state
  private isInitializedSubject = new BehaviorSubject<boolean>(false);
  public isInitialized$ = this.isInitializedSubject.asObservable();

  // Portal SDK service (if available)
  private portalService: any = null;

  constructor() {
    // Try to get the portal SDK from window object if it exists
    this.tryGetPortalSDK();
  }

  private tryGetPortalSDK(): void {
    // In a real implementation, you would check for the portal SDK
    // For now, we'll just use a mock implementation
    console.log("No portal SDK found, using standalone mode");
  }

  /**
   * Initialize the micro app
   */
  async initialize(): Promise<void> {
    try {
      // Create a mock app for standalone mode
      const mockApp: AppData = {
        id: "micro-app-b-angular",
        name: "Angular Micro App",
        version: "1.0.0",
        description: "A standalone Angular micro app",
      };

      // Set the app data
      this.appSubject.next(mockApp);

      // Mark as initialized
      this.isInitializedSubject.next(true);

      console.log("Micro app initialized in standalone mode");
    } catch (error) {
      console.error("Failed to initialize micro app:", error);
      this.isInitializedSubject.next(false);
      throw error;
    }
  }

  /**
   * Navigate within the micro app
   */
  navigateWithinApp(routePath: string): void {
    console.log("Navigate within app:", routePath);
    // In a real implementation, this would communicate with the portal
  }

  /**
   * Navigate in the parent app
   */
  navigateParentApp(routePath: string): void {
    console.log("Navigate parent app:", routePath);
    // In a real implementation, this would communicate with the portal
  }

  /**
   * Show a modal
   */
  showModal(title: string, content: string): void {
    console.log("Show modal:", title);
    alert(`${title}\n\n${content}`);
    // In a real implementation, this would communicate with the portal
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    console.log("Destroying micro app service");
    this.isInitializedSubject.next(false);
    this.appSubject.next(null);
  }
}
