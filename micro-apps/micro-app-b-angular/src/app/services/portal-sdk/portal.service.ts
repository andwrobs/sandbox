import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { initializePortalEventListener } from './portal-event-handler';
import {
  PortalEventType,
  PortalEvent as ReactPortalEvent,
} from '../../../../../portal-react/src/lib/portal-sdk/portal/portal.types';

// Re-export the PortalEventType for use in the Angular app
export { PortalEventType };

// Define event interface based on the React portal's interface
export interface PortalEvent<T = any> {
  type: PortalEventType;
  data: T;
  sourceId: string;
  targetId?: string;
  timestamp?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PortalService {
  private appId: string;
  private debug: boolean;
  private permittedInternalRoutes: string[] = [];
  private permittedParentRoutes: string[] = [];
  private connected$ = new BehaviorSubject<boolean>(false);
  private initialData$ = new BehaviorSubject<any>(null);
  private initialized = false;

  constructor() {
    this.appId = 'micro-app-b';
    this.debug = true;

    // Initialize the portal event listener
    initializePortalEventListener();
  }

  /**
   * Initialize the portal service
   */
  initialize(options: { appId: string; debug?: boolean }): void {
    if (this.initialized) {
      this.log('Portal service already initialized');
      return;
    }

    this.appId = options.appId;
    this.debug = options.debug || false;

    // Set up event listener for portal messages
    window.addEventListener(
      'portal-message',
      this.handlePortalMessage as EventListener
    );

    // Send APP_READY event to the portal
    this.log('Sending APP_READY event to portal');
    this.postMessageToPortal(PortalEventType.APP_READY, {
      appId: this.appId,
      version: '1.0.0',
    });

    this.initialized = true;
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    window.removeEventListener(
      'portal-message',
      this.handlePortalMessage as EventListener
    );
  }

  /**
   * Handle messages from the portal
   */
  private handlePortalMessage = (event: CustomEvent): void => {
    this.log('Received portal message:', event.detail);
    const portalEvent = event.detail as PortalEvent;

    if (portalEvent.type === PortalEventType.APP_IFRAME_LOADED) {
      this.log('Received APP_IFRAME_LOADED event:', portalEvent);

      // Store permissions
      if (portalEvent.data) {
        if (portalEvent.data.permittedInternalRoutes) {
          this.permittedInternalRoutes =
            portalEvent.data.permittedInternalRoutes;
        }
        if (portalEvent.data.permittedParentRoutes) {
          this.permittedParentRoutes = portalEvent.data.permittedParentRoutes;
        }

        // Store initial data if available
        if (portalEvent.data.initialData) {
          this.initialData$.next(portalEvent.data.initialData);
        }
      }

      // Update connection status
      this.connected$.next(true);
    } else if (portalEvent.type === PortalEventType.CUSTOM) {
      this.log('Received CUSTOM event:', portalEvent);
    }
  };

  /**
   * Post a message to the parent portal
   */
  postMessageToPortal(type: PortalEventType, data: any): void {
    const event: PortalEvent = {
      type,
      sourceId: this.appId,
      data,
      timestamp: Date.now(),
    };

    this.log('Posting message to portal:', event);

    // Use postMessage to communicate with the parent window
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(event, '*');
    } else {
      this.log('No parent window found');
    }
  }

  /**
   * Request navigation in the parent application
   */
  navigateParentApplication(routePath: string): void {
    this.postMessageToPortal(PortalEventType.NAVIGATE, { routePath });
  }

  /**
   * Request to show a modal in the parent application
   */
  showModal(modalOptions: any): void {
    this.postMessageToPortal(PortalEventType.SHOW_MODAL, modalOptions);
  }

  /**
   * Get permitted internal routes
   */
  getPermittedInternalRoutes(): string[] {
    return [...this.permittedInternalRoutes];
  }

  /**
   * Get permitted parent routes
   */
  getPermittedParentRoutes(): string[] {
    return [...this.permittedParentRoutes];
  }

  /**
   * Get connection status as an observable
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  /**
   * Get initial data as an observable
   */
  getInitialData(): Observable<any> {
    return this.initialData$.asObservable();
  }

  /**
   * Log messages if debug is enabled
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log(`[PortalService:${this.appId}]`, ...args);
    }
  }
}
