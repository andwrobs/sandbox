import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  type MicroApp,
  type PortalEvent,
  type PortalMessage,
  type PortalModalContent,
  PortalEventTypes,
  PORTAL_TARGET_ID,
} from "../shared";
import { event_schemas } from "../shared/event.types";

interface State {
  id: string | null;
  app: MicroApp | null;
  abortController: AbortController | null;
  debug: boolean;
  initialized: boolean;
  error: Error | null;
}

interface Actions {
  initialize: ({ id }: { id: string }) => Promise<void>;
  destroy: () => void;

  subscribeToPortal: () => void;
  postMessageToPortal: (event: PortalEvent) => void;
  handleMessage: (event: MessageEvent<any>) => void;

  sendReadyEvent: () => void;
  sendErrorEvent: (error?: string) => void;

  navigateWithinApp: (routePath: string) => void;
  navigateParentApp: (routePath: string) => void;

  showModal: (content: PortalModalContent) => void;
  closeModal: () => void;
}

const initialState: State = {
  id: "",
  app: null,
  abortController: null,
  debug: true,
  initialized: false,
  error: null,
};

/**
 * Store for managing a micro-app
 */
export const useMicroAppStore = create<State & Actions>()(
  immer((set, get) => ({
    // state
    ...initialState,

    /**
     * Initialize the micro-app with the portal
     */
    initialize: async ({ id }: { id: string }) => {
      try {
        // Reset state
        set((state) => {
          state.id = initialState.id;
          state.app = initialState.app;
          state.abortController = initialState.abortController;
          state.initialized = initialState.initialized;
          state.error = initialState.error;
        });

        // Set App ID
        set((state) => {
          state.id = id;
        });

        // Set up message listener
        get().subscribeToPortal();

        // Send ready event to portal
        get().sendReadyEvent();

        console.log("here");

        // Wait for initialization with timeout
        let timeoutId;
        await new Promise<void>((resolve, reject) => {
          // Create a function to check if we're initialized
          const checkInitialized = () => {
            if (get().initialized) {
              resolve();
            }
          };

          // Set up an interval to check initialization status
          const intervalId = setInterval(checkInitialized, 100);

          // Set up timeout
          timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            const error = new Error("Initialization timed out");
            set((state) => {
              state.error = error;
            });
            reject(error);
          }, 5000);

          // Also check immediately
          checkInitialized();
        });

        // Clear timeout
        clearTimeout(timeoutId);

        console.log("Micro-app initialized successfully");
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        set((state) => {
          state.error = errorObj;
        });

        get().sendErrorEvent(errorObj.message);
        throw errorObj;
      }
    },

    /**
     * Cleanup when the micro-app is unmounted
     */
    destroy: () => {
      set((state) => {
        const abortController = get().abortController;
        if (abortController) {
          abortController.abort();
          state.abortController = null;
        } else {
          console.debug("Micro-app service already destroyed.");
        }
      });
    },

    /**
     * Subscribe to portal messages
     */
    subscribeToPortal: () => {
      const appId = get().id;
      if (!appId) return;

      // Create a new AbortController if one doesn't exist
      if (!get().abortController) {
        set((state) => {
          state.abortController = new AbortController();
        });
      }

      // Add the event listener with the signal from AbortController
      window.addEventListener("message", get().handleMessage, {
        signal: get().abortController?.signal,
      });
    },

    /**
     * Post a message to the portal
     */
    postMessageToPortal: (event: PortalEvent) => {
      const appId = get().id;
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
    },

    /**
     * Process a message from the portal
     */
    handleMessage: (event: MessageEvent) => {
      try {
        const appId = get().id;
        if (!appId) return;

        const parseResult = event_schemas.portalMessage.safeParse(event.data);
        if (!parseResult.success) return;

        const message = parseResult.data;
        if (message.targetId !== appId) return;

        // Handle the message based on its type
        switch (message.type) {
          case PortalEventTypes.PORTAL_INIT_APP:
            console.log("App initialized with data:", message.data);
            set((state) => {
              state.app = message.data;
              state.initialized = true;
            });
            break;

          default:
            console.debug(`Unhandled message type: ${message.type}`);
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    },

    /**
     * Send the APP_READY event to the portal
     */
    sendReadyEvent: () => {
      get().postMessageToPortal({
        type: PortalEventTypes.APP_READY,
        data: {
          message: `Micro-app ${
            get().id
          } is ready to live its best micro-app life ✅`,
        },
      });
    },

    /**
     * Send an error event to the portal
     */
    sendErrorEvent: (error?: string) => {
      get().postMessageToPortal({
        type: PortalEventTypes.APP_ERROR,
        data: {
          error: "initialization_error",
          message:
            error ||
            `Micro-app ${
              get().id
            } is _not_ ready to live its best micro-app life ❌`,
        },
      });
    },

    /**
     * Navigate within the micro-app (internal navigation)
     */
    navigateWithinApp: (routePath: string) => {
      get().postMessageToPortal({
        type: PortalEventTypes.APP_NAVIGATE_INTERNAL,
        data: {
          routePath,
        },
      });
    },

    /**
     * Request navigation at the parent application level
     */
    navigateParentApp: (routePath: string) => {
      get().postMessageToPortal({
        type: PortalEventTypes.APP_NAVIGATE_PARENT,
        data: {
          routePath,
        },
      });
    },

    /**
     * Show a modal
     */
    showModal: ({ title, body }: PortalModalContent) => {
      get().postMessageToPortal({
        type: PortalEventTypes.APP_SHOW_MODAL,
        data: {
          content: {
            title,
            body,
          },
        },
      });
    },

    /**
     * Close a modal
     */
    closeModal: () => {
      get().postMessageToPortal({
        type: PortalEventTypes.APP_CLOSE_MODAL,
        data: {
          message: "Please close the modal!",
        },
      });
    },
  }))
);
