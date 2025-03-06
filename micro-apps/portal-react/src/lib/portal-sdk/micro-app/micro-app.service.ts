import {
  type PortalEvent,
  type PortalModal,
  PortalEventType,
} from "../portal/portal.types";
import React, { useState, useEffect } from "react";
import { create } from "zustand";
import type { MicroAppServiceOptions, ModalOptions } from "./micro-app.types";

/**
 * MicroApp Service class for micro-apps to communicate with the portal
 */
export class MicroAppService {
  private appId: string;
  private debug: boolean;
  private version: string;
  private features: string[];
  private abortController: AbortController | null = null;
  private eventListeners: Map<string, Set<(event: PortalEvent) => void>> =
    new Map();
  private permittedInternalRoutes: string[] = [];
  private permittedParentRoutes: string[] = [];
  private initialized: boolean = false;
  private initializing: boolean = false;
  private initPromise: Promise<void> | null = null;
  private _appReadySent: boolean = false;

  /**
   * Create a new MicroApp service instance
   * @param options The service configuration options
   */
  constructor(options: MicroAppServiceOptions) {
    this.appId = options.appId;
    this.debug = options.debug || false;
    this.version = options.version || "1.0.0";
    this.features = options.features || [];

    // Set up the abort controller
    this.abortController = new AbortController();

    // Set up message listener with signal
    window.addEventListener("message", this.processWindowMessage, {
      signal: this.abortController.signal,
    });

    this.debugLog("MicroApp service created");
  }

  /**
   * Initialize the service
   * @returns A promise that resolves when initialization is complete
   */
  private async initialize(): Promise<void> {
    // Prevent multiple initializations
    if (this.initialized) return;
    if (this.initializing) return this.initPromise!;

    this.initializing = true;
    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  /**
   * Internal method to perform initialization
   */
  private async _doInitialize(): Promise<void> {
    this.debugLog("Initializing MicroApp service...");

    // Wait for the portal to acknowledge this app
    await new Promise<void>((resolve) => {
      const handleIframeLoaded = (event: MessageEvent) => {
        if (!event.data || !event.data.type) return;

        const portalEvent = event.data as PortalEvent;

        if (
          portalEvent.type === PortalEventType.APP_IFRAME_LOADED &&
          (!portalEvent.targetId || portalEvent.targetId === this.appId)
        ) {
          this.debugLog("Received APP_IFRAME_LOADED event:", portalEvent);

          // Store permissions
          if (portalEvent.data?.permittedInternalRoutes) {
            this.permittedInternalRoutes =
              portalEvent.data.permittedInternalRoutes;
          }
          if (portalEvent.data?.permittedParentRoutes) {
            this.permittedParentRoutes = portalEvent.data.permittedParentRoutes;
          }

          // Remove the temporary listener
          window.removeEventListener("message", handleIframeLoaded);
          resolve();
        }
      };

      // Add temporary listener for APP_IFRAME_LOADED
      window.addEventListener("message", handleIframeLoaded);

      // Send APP_READY to initiate the connection WITHOUT calling postMessageToPortal
      // to avoid the recursion
      this.debugLog("Sending APP_READY event to portal");
      const event: PortalEvent = {
        type: PortalEventType.APP_READY,
        data: {
          appId: this.appId,
          version: this.version,
        },
        sourceId: this.appId,
        timestamp: Date.now(),
      };

      // Post the message directly to the parent window
      window.parent.postMessage(event, "*");

      // Set a timeout in case the portal doesn't respond
      setTimeout(() => {
        window.removeEventListener("message", handleIframeLoaded);
        this.debugLog("Timed out waiting for APP_IFRAME_LOADED event");
        resolve(); // Resolve anyway to prevent hanging
      }, 5000);
    });

    this.initialized = true;
    this.initializing = false;
    this.debugLog("MicroApp service initialized");
  }

  /**
   * Ensure the service is initialized before using it
   * @returns A promise that resolves when the service is initialized
   */
  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    return this.initialize();
  }

  /**
   * Clean up resources when the micro-app is unmounted
   */
  destroy(): void {
    if (!this.abortController) {
      this.debugLog("MicroApp service already destroyed");
      return;
    }

    // This automatically removes all event listeners using this signal
    this.abortController.abort();
    this.abortController = null;
    this.eventListeners.clear();
    this.initialized = false;
    this.debugLog("MicroApp service destroyed");
  }

  /**
   * Register an event listener for portal events
   * @param eventType The event type to listen for, or '*' for all events
   * @param listener The event listener function
   * @returns A function to unregister the listener
   */
  addEventListener(
    eventType: string | "*",
    listener: (event: PortalEvent) => void
  ): () => void {
    const type = eventType === "*" ? "all" : eventType;

    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }

    this.eventListeners.get(type)!.add(listener);

    return () => {
      const listeners = this.eventListeners.get(type);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.eventListeners.delete(type);
        }
      }
    };
  }

  /**
   * Notify registered listeners about an event
   * @param event The portal event
   */
  private notifyEventListeners(event: PortalEvent): void {
    // Notify type-specific listeners
    const typeListeners = this.eventListeners.get(event.type);
    if (typeListeners) {
      typeListeners.forEach((listener) => listener(event));
    }

    // Notify listeners for all events
    const allListeners = this.eventListeners.get("all");
    if (allListeners) {
      allListeners.forEach((listener) => listener(event));
    }
  }

  /**
   * Process messages from the portal
   */
  private processWindowMessage = (messageEvent: MessageEvent): void => {
    // Validate the event data
    if (!messageEvent.data || !messageEvent.data.type) return;

    const portalEvent = messageEvent.data as PortalEvent;

    // Only process events targeted at this app or broadcasts
    if (portalEvent.targetId && portalEvent.targetId !== this.appId) return;

    this.debugLog("Received message from portal:", portalEvent);

    // Notify registered listeners
    this.notifyEventListeners(portalEvent);

    // Handle specific event types
    switch (portalEvent.type) {
      case PortalEventType.APP_IFRAME_LOADED:
        this.initialized = true;
        this.permittedInternalRoutes =
          portalEvent.data.permittedInternalRoutes || [];
        this.permittedParentRoutes =
          portalEvent.data.permittedParentRoutes || [];
        this.debugLog("App loaded with permissions:", {
          internal: this.permittedInternalRoutes,
          parent: this.permittedParentRoutes,
        });

        // Send ready event to portal
        this.sendReadyEvent();
        break;

      case PortalEventType.APP_ERROR:
        console.error(
          `Portal error: ${portalEvent.data.error}`,
          portalEvent.data.message
        );
        break;

      case PortalEventType.ROUTE_CHANGED:
        // Handle route changes from other apps or the portal
        if (
          !portalEvent.data.internal ||
          portalEvent.data.appId !== this.appId
        ) {
          // Dispatch a custom event for the app to handle external route changes
          const routeEvent = new CustomEvent("portal-route-changed", {
            detail: portalEvent.data,
          });
          window.dispatchEvent(routeEvent);
        }
        break;
    }

    // Dispatch custom event for app to handle
    const customEvent = new CustomEvent("portal-message", {
      detail: portalEvent,
    });
    window.dispatchEvent(customEvent);
  };

  /**
   * Send the APP_READY event to the portal
   */
  sendReadyEvent(): void {
    this.postMessageToPortal(PortalEventType.APP_READY, {
      version: this.version,
      features: this.features,
      initialRoute: window.location.pathname,
    });
  }

  /**
   * Post a message to the portal
   * @param type The type of event to send
   * @param data The data to send with the event
   */
  async postMessageToPortal(type: PortalEventType, data: any): Promise<void> {
    // Prevent sending duplicate APP_READY events
    if (type === PortalEventType.APP_READY) {
      if (this._appReadySent) {
        console.log("APP_READY already sent, skipping");
        return;
      }
      this._appReadySent = true;
    }

    console.log(`Posting message to portal: ${type}`, data);

    const event: PortalEvent = {
      type,
      data,
      sourceId: this.appId,
      timestamp: Date.now(),
    };

    // Post the message to the parent window (portal)
    window.parent.postMessage(event, "*");
  }

  /**
   * Send a message to another micro-app
   * @param targetAppId The ID of the target micro-app
   * @param type The event type
   * @param data The event data
   */
  postMessageToApp(
    targetAppId: string,
    type: PortalEventType,
    data: any
  ): void {
    if (!this.initialized) {
      console.warn("MicroApp service not fully initialized yet");
    }

    const message: PortalEvent = {
      type,
      data,
      sourceId: this.appId,
      targetId: targetAppId,
      timestamp: Date.now(),
    };

    this.debugLog(`Sending message to app ${targetAppId}:`, message);
    window.parent.postMessage(message, "*");
  }

  /**
   * Navigate within the micro-app (internal navigation)
   * This changes the URL within the iframe but doesn't affect the parent application
   * @param routePath The path to navigate to within the micro-app
   */
  navigateWithinApp(routePath: string): void {
    this.postMessageToPortal(PortalEventType.NAVIGATE, {
      routePath,
      internal: true,
    });

    // The actual navigation happens in the micro-app itself
    // This just notifies the portal for validation and tracking
  }

  /**
   * Request navigation at the parent application level
   * This changes the browser URL and affects the entire application
   * @param routePath The path to navigate to in the parent application
   */
  navigateParentApplication(routePath: string): void {
    this.postMessageToPortal(PortalEventType.NAVIGATE, {
      routePath,
      internal: false,
    });
  }

  /**
   * Show a modal
   * @param options Modal options
   * @returns The modal ID
   */
  showModal(options: ModalOptions): string {
    const modalId = options.id || `modal-${Date.now()}`;

    this.postMessageToPortal(PortalEventType.SHOW_MODAL, {
      id: modalId,
      htmlContent: options.content,
      displayOptions: {
        width: options.width,
        height: options.height,
        closeOnOverlayClick: options.closeOnOverlayClick,
        showCloseButton: options.showCloseButton,
        contentStyle: options.contentStyle,
      },
    });

    return modalId;
  }

  /**
   * Close a modal
   * @param modalId The ID of the modal to close
   */
  closeModal(modalId: string): void {
    this.postMessageToPortal(PortalEventType.CLOSE_MODAL, { id: modalId });
  }

  /**
   * Get the permitted internal routes for this micro-app
   * @returns Array of permitted internal routes
   */
  getPermittedInternalRoutes(): string[] {
    return [...this.permittedInternalRoutes];
  }

  /**
   * Get the permitted parent routes for this micro-app
   * @returns Array of permitted parent routes
   */
  getPermittedParentRoutes(): string[] {
    return [...this.permittedParentRoutes];
  }

  /**
   * Check if the service is fully initialized
   * @returns True if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Log a message if debug mode is enabled
   * @param message The message to log
   * @param data Optional data to log
   */
  private debugLog(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[MicroApp:${this.appId}] ${message}`, ...args);
    }
  }
}

/**
 * State interface for the MicroApp Service store
 */
interface MicroAppServiceState {
  /**
   * Map of MicroAppService instances by appId
   */
  services: Record<string, MicroAppService>;
}

/**
 * Actions interface for the MicroApp Service store
 */
interface MicroAppServiceActions {
  /**
   * Gets the existing MicroAppService instance or creates a new one if none exists
   * @param options The service configuration options
   * @returns The MicroAppService instance
   */
  getOrCreateService: (options: MicroAppServiceOptions) => MicroAppService;

  /**
   * Removes a service instance from the store
   * @param appId The ID of the micro-app
   */
  removeService: (appId: string) => void;
}

/**
 * Initial state for the MicroApp Service store
 */
const initialState: MicroAppServiceState = {
  services: {},
};

/**
 * Store for managing the MicroAppService instances
 * Uses Zustand to provide a centralized way to access the services
 */
export const useMicroAppServiceStore = create<
  MicroAppServiceState & MicroAppServiceActions
>()((set, get) => ({
  ...initialState,

  getOrCreateService: (options: MicroAppServiceOptions) => {
    const { appId } = options;
    const services = get().services;

    if (!services[appId]) {
      const newService = new MicroAppService(options);
      set((state) => ({
        services: {
          ...state.services,
          [appId]: newService,
        },
      }));
    }

    return get().services[appId];
  },

  removeService: (appId: string) => {
    const services = get().services;

    if (services[appId]) {
      services[appId].destroy();

      set((state) => {
        const { [appId]: _, ...rest } = state.services;
        return { services: rest };
      });
    }
  },
}));

/**
 * React hook for using the MicroApp service
 * @param options The service configuration options
 * @returns The MicroApp service instance
 */
export function useMicroAppService(
  options: MicroAppServiceOptions
): MicroAppService {
  const { appId } = options;
  const service = useMicroAppServiceStore((state) =>
    state.getOrCreateService(options)
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the service when the component mounts
  useEffect(() => {
    let isMounted = true;

    // Async function to initialize the service
    const initService = async () => {
      try {
        await service.ensureInitialized();
        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to initialize MicroApp service:", error);
      }
    };

    initService();

    return () => {
      isMounted = false;
    };
  }, [service]);

  return service;
}
