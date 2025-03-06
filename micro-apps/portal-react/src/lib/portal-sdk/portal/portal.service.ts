import {
  PortalEventType,
  type MicroApp,
  type PortalEvent,
  type PortalModal,
} from "./portal.types";
import { usePortalStore } from "./portal.store";
import React from "react";
import { create } from "zustand";

/**
 * Main Portal Service API for parent applications
 */
export class PortalService {
  private abortController: AbortController | null = null;
  private isInitialized: boolean = false;
  private eventListeners: Array<(event: PortalEvent) => void> = [];

  constructor() {
    // Initialize with empty state
  }

  /**
   * Register a listener for portal events
   * @param listener The event listener function
   * @returns A function to unregister the listener
   */
  addEventListener(listener: (event: PortalEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index !== -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all registered listeners about an event
   * @param event The portal event
   */
  notifyEventListeners(event: PortalEvent): void {
    this.eventListeners.forEach((listener) => listener(event));
  }

  /**
   * Initialize the portal message handling system
   */
  initializeMessageHandling(): void {
    // Prevent multiple initializations
    if (this.isInitialized) {
      console.debug("Portal message handling already initialized");
      return;
    }

    // Clean up any existing controller
    this.cleanupMessageHandling();

    // Create new AbortController
    this.abortController = new AbortController();

    // Set up global message listener with signal
    window.addEventListener("message", this.processWindowMessage, {
      signal: this.abortController.signal,
    });

    this.isInitialized = true;
    console.debug("Portal message handling initialized");
  }

  /**
   * Clean up portal message handling resources
   */
  cleanupMessageHandling(): void {
    if (!this.isInitialized) {
      console.debug(
        "Portal message handling not initialized, nothing to clean up"
      );
      return;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.isInitialized = false;
    console.debug("Portal message handling cleaned up");
  }

  /**
   * Process messages from micro-apps
   */
  private processWindowMessage = (messageEvent: MessageEvent): void => {
    // Validate the event data
    if (!messageEvent.data || !messageEvent.data.type) return;

    const event = messageEvent.data as PortalEvent;

    // Process the event
    usePortalStore.getState().processPortalEvent(event);

    // Notify listeners about the incoming message
    this.notifyEventListeners(event);
  };

  /**
   * Register a micro-app with the portal
   * @param app The micro-app configuration
   */
  registerMicroApp(app: MicroApp): void {
    usePortalStore.getState().registerMicroApp(app);
  }

  /**
   * Register an iframe for a micro-app
   * @param appId The ID of the micro-app
   * @param iframeRef The iframe element reference
   */
  registerMicroAppIframe(appId: string, iframeRef: HTMLIFrameElement): void {
    usePortalStore.getState().setMicroAppIframeRef(appId, iframeRef);

    // Send app loaded event to the micro-app
    if (iframeRef.contentWindow) {
      const event: PortalEvent = {
        type: PortalEventType.APP_IFRAME_LOADED,
        data: {
          appId,
          permittedInternalRoutes:
            usePortalStore.getState().microApps[appId]
              ?.permittedInternalRoutes || [],
          permittedParentRoutes:
            usePortalStore.getState().microApps[appId]?.permittedParentRoutes ||
            [],
        },
        sourceId: "portal",
        targetId: appId,
        timestamp: Date.now(),
      };

      iframeRef.contentWindow.postMessage(event, "*");
    }
  }

  /**
   * Unregister a micro-app from the portal
   * @param appId The ID of the micro-app
   */
  unregisterMicroApp(appId: string): void {
    if (!appId) {
      console.warn("Cannot unregister micro-app: No app ID provided");
      return;
    }

    // Check if the app exists before trying to unregister it
    const microApps = usePortalStore.getState().microApps;
    if (!microApps[appId]) {
      console.debug(`Micro-app ${appId} not found, nothing to unregister`);
      return;
    }

    console.debug(`Unregistering micro-app ${appId}`);
    usePortalStore.getState().unregisterMicroApp(appId);
  }

  /**
   * Navigate to a route at the parent application level
   * This changes the browser URL and affects the entire application
   * @param routePath The path to navigate to
   */
  navigateParentApplication(routePath: string): void {
    window.history.pushState({}, "", routePath);

    // Create event
    const event: PortalEvent = {
      type: PortalEventType.ROUTE_CHANGED,
      data: {
        routePath,
        internal: false,
        sourceId: "portal",
      },
      sourceId: "portal",
      timestamp: Date.now(),
    };

    // Notify apps about the route change
    this.broadcastToAllApps(PortalEventType.ROUTE_CHANGED, {
      routePath,
      internal: false,
      sourceId: "portal",
    });

    // Notify listeners
    this.notifyEventListeners(event);
  }

  /**
   * Get all registered micro-apps
   * @returns Record of micro-apps
   */
  getAllMicroApps(): Record<string, MicroApp> {
    return usePortalStore.getState().microApps;
  }

  /**
   * Get a specific micro-app by ID
   * @param appId The ID of the micro-app
   * @returns The micro-app or undefined if not found
   */
  getMicroAppById(appId: string): MicroApp | undefined {
    return usePortalStore.getState().microApps[appId];
  }

  /**
   * Get all active modals
   * @returns Array of active modals
   */
  getActiveModals(): PortalModal[] {
    return usePortalStore.getState().activeModals;
  }

  /**
   * Send a message to a specific micro-app
   * @param appId The ID of the target micro-app
   * @param type The type of event to send
   * @param data The data to send with the event
   */
  postMessageToApp(appId: string, type: PortalEventType, data: any): void {
    const app = usePortalStore.getState().microApps[appId];

    if (!app || !app.iframeRef || !app.iframeRef.contentWindow) {
      console.warn(
        `Cannot send message to app ${appId}: app not found or iframe not ready`
      );
      return;
    }

    const event: PortalEvent = {
      type,
      data,
      sourceId: "portal",
      targetId: appId,
      timestamp: Date.now(),
    };

    app.iframeRef.contentWindow.postMessage(event, "*");

    // Notify listeners about the outgoing message
    this.notifyEventListeners(event);
  }

  /**
   * Broadcast a message to all registered micro-apps
   * @param type The type of event to broadcast
   * @param data The data to send with the event
   */
  broadcastToApps(type: PortalEventType, data: any): void {
    const apps = usePortalStore.getState().microApps;

    Object.values(apps).forEach((app) => {
      if (app.iframeRef?.contentWindow) {
        const event: PortalEvent = {
          type,
          data,
          sourceId: "portal",
          timestamp: Date.now(),
        };

        app.iframeRef.contentWindow.postMessage(event, "*");

        // Notify listeners about the outgoing message
        this.notifyEventListeners(event);
      }
    });
  }

  /**
   * Broadcast a message to all micro-apps
   * @param type The event type
   * @param data The event data
   */
  broadcastToAllApps(type: PortalEventType, data: any): void {
    const apps = usePortalStore.getState().microApps;

    Object.values(apps).forEach((app) => {
      if (app.iframeRef?.contentWindow) {
        const event: PortalEvent = {
          type,
          data,
          sourceId: "portal",
          timestamp: Date.now(),
        };

        app.iframeRef.contentWindow.postMessage(event, "*");

        // Notify listeners about the outgoing message
        this.notifyEventListeners(event);
      }
    });
  }
}
