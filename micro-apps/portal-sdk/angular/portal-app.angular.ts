import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import {
  type MicroApp,
  type PortalEvent,
  type PortalMessage,
  type PortalModal,
  PortalEventTypes,
  PORTAL_TARGET_ID,
  validateRoute,
  event_schemas,
} from "../shared";

/**
 * Interface for storing iframe references
 */
interface IframeRefs {
  [appId: string]: HTMLIFrameElement | null;
}

/**
 * Service for managing iframe references
 */
@Injectable({
  providedIn: "root",
})
export class IframeRefService {
  private iframeRefs: IframeRefs = {};

  /**
   * Register an iframe reference
   */
  registerIframe(appId: string, iframeRef: HTMLIFrameElement): void {
    this.iframeRefs[appId] = iframeRef;
  }

  /**
   * Get an iframe reference
   */
  getIframeRef(appId: string): HTMLIFrameElement | null {
    return this.iframeRefs[appId] || null;
  }

  /**
   * Unregister an iframe reference
   */
  unregisterIframe(appId: string): void {
    if (this.iframeRefs[appId]) {
      this.iframeRefs[appId] = null;
    }
  }
}

/**
 * State interface for the Portal service
 */
interface PortalState {
  apps: Record<string, MicroApp>;
  modal?: PortalModal;
  debug: boolean;
  isInitialized: boolean;
}

/**
 * Interface for Portal initialization props
 */
interface PortalInitializerProps {
  apps: Record<string, MicroApp>;
  navigate: (routePath: string) => void;
}

/**
 * Angular service for managing the portal and its micro-apps
 */
@Injectable({
  providedIn: "root",
})
export class PortalAppService implements OnDestroy {
  private abortController: AbortController | null = null;
  private navigateFunction: ((routePath: string) => void) | null = null;

  // State management using BehaviorSubject
  private state = new BehaviorSubject<PortalState>({
    apps: {},
    modal: undefined,
    debug: true,
    isInitialized: false,
  });

  // Observables for components to subscribe to
  readonly apps$ = this.state.asObservable().pipe(map((state) => state.apps));

  readonly modal$ = this.state.asObservable().pipe(map((state) => state.modal));

  readonly isInitialized$ = this.state
    .asObservable()
    .pipe(map((state) => state.isInitialized));

  constructor(private iframeRefService: IframeRefService) {}

  /**
   * Initialize the portal
   */
  async initialize({ apps, navigate }: PortalInitializerProps): Promise<void> {
    // Reset state
    this.state.next({
      apps: {},
      modal: undefined,
      debug: true,
      isInitialized: false,
    });

    // Set up app registry and navigation function
    this.updateState({
      apps,
      isInitialized: true,
    });
    this.navigateFunction = navigate;

    // Set up message listener
    this.subscribeToMessages();
  }

  /**
   * Cleanup when the portal is destroyed
   */
  ngOnDestroy(): void {
    this.destroy();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    } else {
      console.debug("Portal service already destroyed.");
    }
  }

  /**
   * Subscribe to messages from micro-apps
   */
  private subscribeToMessages(): void {
    // Create a new AbortController if one doesn't exist
    if (!this.abortController) {
      this.abortController = new AbortController();
    }

    // Add the event listener with the signal from AbortController
    window.addEventListener("message", this.handleMessage.bind(this), {
      signal: this.abortController.signal,
    });
  }

  /**
   * Post a message to a micro-app
   */
  postMessageToApp(appId: string, event: PortalEvent): void {
    const appIframeRef = this.iframeRefService.getIframeRef(appId);

    if (appIframeRef && appIframeRef.contentWindow) {
      const portalMessage: PortalMessage = {
        ...event,
        sourceId: PORTAL_TARGET_ID,
        targetId: appId,
        timestamp: Date.now(),
      };

      appIframeRef.contentWindow.postMessage(portalMessage, "*");
    } else {
      console.debug(
        "Error: cannot post message to app before iframe is initialized."
      );
    }
  }

  /**
   * Process a message from a micro-app
   */
  private handleMessage(event: MessageEvent): void {
    try {
      if (!this.state.value.isInitialized) return;

      const parseResult = event_schemas.portalMessage.safeParse(event.data);
      if (!parseResult.success) return;

      const message = parseResult.data;
      if (message.targetId !== PORTAL_TARGET_ID) return;

      switch (message.type) {
        case PortalEventTypes.APP_READY:
          const requestedAppConfig = this.state.value.apps[message.sourceId];
          if (requestedAppConfig) {
            this.sendPortalInitApp(requestedAppConfig);
          }
          break;

        case PortalEventTypes.APP_NAVIGATE_INTERNAL:
          this.handleInternalNavigation(
            message.sourceId,
            message.data.routePath
          );
          break;

        case PortalEventTypes.APP_NAVIGATE_PARENT:
          this.handlePortalNavigation(message.sourceId, message.data.routePath);
          break;

        case PortalEventTypes.APP_SHOW_MODAL:
          this.showModal({
            appId: message.sourceId,
            content: message.data.content,
            displayOptions: message.data.displayOptions,
          });
          break;

        case PortalEventTypes.APP_CLOSE_MODAL:
          this.closeModal();
          break;

        default:
          console.log(`Unhandled message type: ${message.type}`);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }

  /**
   * Send initialization data to a micro-app
   */
  sendPortalInitApp(targetApp: MicroApp): void {
    this.postMessageToApp(targetApp.id, {
      type: PortalEventTypes.PORTAL_INIT_APP,
      data: targetApp,
    });
  }

  /**
   * Handle internal navigation within a micro app
   */
  async handleInternalNavigation(
    appId: string,
    routePath: string
  ): Promise<void> {
    const app = this.state.value.apps[appId];
    const validationResult = validateRoute(
      routePath,
      app.permittedInternalRoutes,
      { ignoreTrailingSlash: true }
    );
    const isBoundaryViolation = !validationResult.matched;

    if (isBoundaryViolation) {
      this.postMessageToApp(appId, {
        type: "portal:internal_navigation_error",
        data: {
          message: "Insufficient permissions to navigate there.",
          error: "internal_navigation_boundary_violation",
          routePath: routePath,
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert("That wasn't allowed");
      this.resetAppToEntryPoint(appId);
    }
  }

  /**
   * Handle portal navigation request from a micro app
   */
  handlePortalNavigation(appId: string, routePath: string): void {
    const app = this.state.value.apps[appId];
    const validationResult = validateRoute(
      routePath,
      app.permittedParentRoutes,
      { ignoreTrailingSlash: true }
    );
    const isBoundaryViolation = !validationResult.matched;

    if (isBoundaryViolation) {
      this.postMessageToApp(appId, {
        type: "portal:parent_navigation_error",
        data: {
          message: "Insufficient permissions to navigate there.",
          error: "parent_navigation_boundary_violation",
          routePath: routePath,
        },
      });
    } else if (this.navigateFunction) {
      this.navigateFunction(routePath);
    }
  }

  /**
   * Reset a micro-app to its entry point
   */
  resetAppToEntryPoint(appId: string): void {
    const app = this.state.value.apps[appId];
    if (app) {
      const iframe = this.iframeRefService.getIframeRef(appId);
      if (iframe) {
        iframe.src = `${app.baseUrl}${app.entryPoint}`;
      }
    }
  }

  /**
   * Show a modal
   */
  showModal(modal: PortalModal): void {
    this.updateState({ modal });
  }

  /**
   * Close the modal
   */
  closeModal(): void {
    this.updateState({ modal: undefined });
  }

  /**
   * Update the state with partial changes
   */
  private updateState(partialState: Partial<PortalState>): void {
    this.state.next({
      ...this.state.value,
      ...partialState,
    });
  }
}

// Helper function for rxjs pipe
function map<T, R>(fn: (value: T) => R) {
  return (source: Observable<T>): Observable<R> => {
    return new Observable<R>((subscriber) => {
      const subscription = source.subscribe({
        next(value) {
          try {
            subscriber.next(fn(value));
          } catch (err) {
            subscriber.error(err);
          }
        },
        error(err) {
          subscriber.error(err);
        },
        complete() {
          subscriber.complete();
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    });
  };
}
