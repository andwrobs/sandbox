import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  type MicroApp,
  type PortalEvent,
  type PortalMessage,
  type PortalModal,
  PortalEventTypes,
  PORTAL_TARGET_ID,
  validateRoute,
} from "../shared";
import { event_schemas } from "../shared/event.types";

/**
 * usePortalAppStore components
 */

interface PortalState {
  apps: Record<string, MicroApp>;
  modal?: PortalModal;
  abortController: AbortController | null;
  debug: boolean;
  isInitialized: boolean;
  navigate: (routePath: string) => void;
}

interface PortalInitializerProps {
  apps: Record<string, MicroApp>;
  navigate: (routePath: string) => void;
}

interface PortalActions {
  initialize: (props: PortalInitializerProps) => Promise<void>;
  destroy: () => void;

  subscribeToMessages: () => void;
  handleMessage: (message: MessageEvent) => void;
  postMessageToApp: (appId: string, event: PortalEvent) => void;

  sendPortalInitApp: (app: MicroApp) => void;

  handleInternalNavigation: (appId: string, routePath: string) => void;
  handlePortalNavigation: (appId: string, routePath: string) => void;
  resetAppToEntryPoint: (appId: string) => void;

  showModal: (modal: PortalModal) => void;
  closeModal: () => void;
}

const initialState: PortalState = {
  apps: {},
  modal: undefined,
  abortController: null,
  debug: true,
  isInitialized: false,
  navigate: () => null,
};

export const usePortalAppStore = create<PortalState & PortalActions>()(
  immer((set, get) => ({
    // state
    ...initialState,

    /**
     * Initialize the portal
     */
    initialize: async ({ apps, navigate }) => {
      // Reset state
      set((state) => {
        state.apps = initialState.apps;
        state.modal = initialState.modal;
        state.abortController = initialState.abortController;
        state.debug = initialState.debug;
        state.isInitialized = initialState.isInitialized;
      });

      // Set up app registry
      set((state) => {
        state.apps = apps;
        state.navigate = navigate;
      });

      // Set up message listener
      get().subscribeToMessages();

      // Save successful completion
      set((state) => {
        state.isInitialized = true;
      });
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
     * Subscribe to messages
     */
    subscribeToMessages: () => {
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
    postMessageToApp: (appId: string, event: PortalEvent) => {
      const appIframeRef = useIframeRefsStore.getState().getIframeRef(appId);

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
          "Error: cannot post message to portal before application is initialized."
        );
      }
    },

    /**
     * Process a message from the portal
     */
    handleMessage: (event: MessageEvent) => {
      try {
        if (!get().isInitialized) return;

        const parseResult = event_schemas.portalMessage.safeParse(event.data);
        if (!parseResult.success) return;

        const message = parseResult.data;
        if (message.targetId !== PORTAL_TARGET_ID) return;

        switch (message.type) {
          //
          case "app:ready":
            const requestedAppConfig = get().apps[message.sourceId];
            if (requestedAppConfig) {
              get().sendPortalInitApp(requestedAppConfig);
            }
            break;
          //
          case "app:navigation:internal":
            get().handleInternalNavigation(
              message.sourceId,
              message.data.routePath
            );
            break;
          //
          case "app:navigation:parent":
            get().handlePortalNavigation(
              message.sourceId,
              message.data.routePath
            );
            break;
          //
          case "app:modal:show":
            get().showModal({ ...message.data, appId: message.sourceId });
            break;
          //
          case "app:modal:close":
            get().closeModal();
            break;
          //
          default:
            console.log(`Unhandled message type: ${message.type}`);
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    },

    /**
     * Send the  event to the portal
     */
    sendPortalInitApp: (targetApp: MicroApp) => {
      get().postMessageToApp(targetApp.id, {
        type: PortalEventTypes.PORTAL_INIT_APP,
        data: targetApp,
      });
    },

    /**
     * Handle internal navigation within a micro app
     */
    handleInternalNavigation: async (appId: string, routePath: string) => {
      const app = get().apps[appId];
      const validationResult = validateRoute(
        routePath,
        app.permittedInternalRoutes,
        { ignoreTrailingSlash: true }
      );
      const isBoundaryViolation = !validationResult.matched;

      if (isBoundaryViolation) {
        get().postMessageToApp(appId, {
          type: "portal:internal_navigation_error",
          data: {
            message: "Insufficient permissions to navigate there.",
            error: "internal_navigation_boundary_violation",
            routePath: routePath,
          },
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
        alert("That wasn't allowed");
        get().resetAppToEntryPoint(appId);
      }
    },

    /**
     * Handle portal navigation request from a micro app
     */
    handlePortalNavigation: (appId: string, routePath: string) => {
      const app = get().apps[appId];
      const validationResult = validateRoute(
        routePath,
        app.permittedParentRoutes,
        { ignoreTrailingSlash: true }
      );
      const isBoundaryViolation = !validationResult.matched;

      if (isBoundaryViolation) {
        get().postMessageToApp(appId, {
          type: "portal:parent_navigation_error",
          data: {
            message: "Insufficient permissions to navigate there.",
            error: "parent_navigation_boundary_violation",
            routePath: routePath,
          },
        });
      } else {
        get().navigate(routePath);
      }
    },

    /**
     * Used if the app tries to navigate somewhere it's not supposed to be
     */
    resetAppToEntryPoint: (appId: string) => {
      const app = get().apps[appId];
      const iframeRef = useIframeRefsStore.getState().getIframeRef(appId);

      if (app && iframeRef) {
        // Construct the entry point URL
        const entryUrl = new URL(app.entryPoint, app.baseUrl).toString();

        // Reset the iframe src to the entry point
        iframeRef.src = entryUrl;

        // Optionally notify the app that it's been reset
        // get().postMessageToApp(appId, {
        //   type: "portal:navigation_reset",
        //   data: {
        //     message:
        //       "Navigation reset to entry point due to boundary violation",
        //     routePath: app.entryPoint,
        //   },
        // });
      }
    },

    /**
     * Close the current portal modal
     */
    showModal: (modal: PortalModal) => {
      set((state) => {
        state.modal = {
          appId: modal.appId,
          content: modal.content,
        };
      });
    },

    /**
     * Close the current portal modal
     */
    closeModal: () => {
      set((state) => {
        state.modal = undefined;
      });
    },
  }))
);

/**
 * useIframeRefsStore - Separate store for iframe references
 * Uses regular Zustand without Immer to avoid issues with DOM elements
 */
interface IframeRefsState {
  iframeRefs: Record<string, HTMLIFrameElement>;
}

interface IframeRefsActions {
  setIframeRef: (appId: string, ref: HTMLIFrameElement | null) => void;
  getIframeRef: (appId: string) => HTMLIFrameElement | undefined;
  removeIframeRef: (appId: string) => void;
  clearAllRefs: () => void;
}

export const useIframeRefsStore = create<IframeRefsState & IframeRefsActions>()(
  (set, get) => ({
    // State
    iframeRefs: {},

    // Actions
    setIframeRef: (appId, ref) =>
      set((state) => {
        if (ref === null) {
          // Remove the ref if null is passed
          const { [appId]: _, ...rest } = state.iframeRefs;
          return { iframeRefs: rest };
        }

        // Add/update the ref
        return {
          iframeRefs: {
            ...state.iframeRefs,
            [appId]: ref,
          },
        };
      }),

    getIframeRef: (appId) => get().iframeRefs[appId],

    removeIframeRef: (appId) =>
      set((state) => {
        const { [appId]: _, ...rest } = state.iframeRefs;
        return { iframeRefs: rest };
      }),

    clearAllRefs: () => set({ iframeRefs: {} }),
  })
);
