/* File: micro-app.angular.ts */
// Angular implementation would go here
// This file was not present in the original core.types.ts

import { Injectable, OnDestroy } from "@angular/core";
import { BehaviorSubject, Observable, firstValueFrom, Subject } from "rxjs";
import { filter, take, timeout } from "rxjs/operators";
import {
  type MicroApp,
  type PortalEvent,
  type PortalMessage,
  type PortalModalContent,
  PortalEventTypes,
  PORTAL_TARGET_ID,
  event_schemas,
} from "../shared";

/**
 * State interface for the MicroApp service
 */
interface MicroAppState {
  id: string | null;
  app: MicroApp | null;
  debug: boolean;
  initialized: boolean;
  error: Error | null;
}

/**
 * Angular service for managing a micro-app's communication with the portal
 */
@Injectable({
  providedIn: "root",
})
export class MicroAppService implements OnDestroy {
  private abortController: AbortController | null = null;

  // State management using BehaviorSubject
  private state = new BehaviorSubject<MicroAppState>({
    id: null,
    app: null,
    debug: true,
    initialized: false,
    error: null,
  });

  // Observables for components to subscribe to
  readonly app$ = this.state.pipe(
    filter((state) => state.app !== null),
    map((state) => state.app as MicroApp)
  );

  readonly initialized$ = this.state
    .asObservable()
    .pipe(map((state) => state.initialized));

  readonly error$ = this.state.asObservable().pipe(map((state) => state.error));

  // Subject for initialization completion
  private initCompleted = new Subject<void>();

  constructor() {}

  /**
   * Initialize the micro-app with the portal
   */
  async initialize({ id }: { id: string }): Promise<void> {
    try {
      // Reset state
      this.state.next({
        id: null,
        app: null,
        debug: true,
        initialized: false,
        error: null,
      });

      // Set App ID
      this.updateState({ id });

      // Set up message listener
      this.subscribeToPortal();

      // Send ready event to portal
      this.sendReadyEvent();

      // Wait for initialization with timeout
      await firstValueFrom(
        this.initialized$.pipe(
          filter((initialized) => initialized === true),
          take(1),
          timeout(5000)
        )
      );

      console.log("Micro-app initialized successfully");
      this.initCompleted.next();
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      this.updateState({ error: errorObj });
      this.sendErrorEvent(errorObj.message);
      throw errorObj;
    }
  }

  /**
   * Cleanup when the micro-app is unmounted
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
      console.debug("Micro-app service already destroyed.");
    }
  }

  /**
   * Subscribe to portal messages
   */
  private subscribeToPortal(): void {
    const appId = this.state.value.id;
    if (!appId) return;

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
   * Post a message to the portal
   */
  postMessageToPortal(event: PortalEvent): void {
    const appId = this.state.value.id;
    if (appId) {
      const portalMessage: PortalMessage = {
        ...event,
        sourceId: appId,
        targetId: PORTAL_TARGET_ID,
        timestamp: Date.now(),
      };

      window.parent.postMessage(portalMessage, "*");
    } else {
      console.debug(
        "Error: cannot post message to portal before application is initialized."
      );
    }
  }

  /**
   * Process a message from the portal
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const appId = this.state.value.id;
      if (!appId) return;

      const parseResult = event_schemas.portalMessage.safeParse(event.data);
      if (!parseResult.success) return;

      const message = parseResult.data;
      if (message.targetId !== appId) return;

      // Handle the message based on its type
      switch (message.type) {
        case PortalEventTypes.PORTAL_INIT_APP:
          console.log("App initialized with data:", message.data);
          this.updateState({
            app: message.data,
            initialized: true,
          });
          break;

        default:
          console.debug(`Unhandled message type: ${message.type}`);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  }

  /**
   * Send the APP_READY event to the portal
   */
  sendReadyEvent(): void {
    this.postMessageToPortal({
      type: PortalEventTypes.APP_READY,
      data: {
        message: `Micro-app ${this.state.value.id} is ready to live its best micro-app life ✅`,
      },
    });
  }

  /**
   * Send an error event to the portal
   */
  sendErrorEvent(error?: string): void {
    this.postMessageToPortal({
      type: PortalEventTypes.APP_ERROR,
      data: {
        error: "initialization_error",
        message:
          error ||
          `Micro-app ${this.state.value.id} is _not_ ready to live its best micro-app life ❌`,
      },
    });
  }

  /**
   * Navigate within the micro-app (internal navigation)
   */
  navigateWithinApp(routePath: string): void {
    this.postMessageToPortal({
      type: PortalEventTypes.APP_NAVIGATE_INTERNAL,
      data: {
        routePath,
      },
    });
  }

  /**
   * Request the parent app to navigate
   */
  navigateParentApp(routePath: string): void {
    this.postMessageToPortal({
      type: PortalEventTypes.APP_NAVIGATE_PARENT,
      data: {
        routePath,
      },
    });
  }

  /**
   * Show a modal in the parent app
   */
  showModal(content: PortalModalContent): void {
    this.postMessageToPortal({
      type: PortalEventTypes.APP_SHOW_MODAL,
      data: {
        content,
      },
    });
  }

  /**
   * Close the modal in the parent app
   */
  closeModal(): void {
    this.postMessageToPortal({
      type: PortalEventTypes.APP_CLOSE_MODAL,
      data: {
        message: "Close modal requested by micro-app",
      },
    });
  }

  /**
   * Update the state with partial changes
   */
  private updateState(partialState: Partial<MicroAppState>): void {
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
