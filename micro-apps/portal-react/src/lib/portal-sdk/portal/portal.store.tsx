import { create } from "zustand";
import {
  PortalEventType,
  type MicroApp,
  type PortalEvent,
  type PortalModal,
} from "./portal.types";
import { PortalSecurity } from "./portal.security";

/**
 * Portal state interface
 */
interface PortalState {
  /** Registry of micro-apps */
  microApps: Record<string, MicroApp>;
  /** Active modals */
  activeModals: PortalModal[];
  modals: PortalModal[];
  portalService: any; // This should be properly typed
}

/**
 * Portal actions interface
 */
interface PortalActions {
  /** Register a micro-app with the portal */
  registerMicroApp: (app: MicroApp) => void;
  /** Set the iframe reference for a micro-app */
  setMicroAppIframeRef: (appId: string, iframeRef: HTMLIFrameElement) => void;
  /** Unregister a micro-app from the portal */
  unregisterMicroApp: (appId: string) => void;
  /** Reset a micro-app to its entry point */
  resetMicroAppToEntryPoint: (appId: string) => void;
  /** Show a modal */
  showModal: (modal: PortalModal) => void;
  /** Close a modal */
  closeModal: (modalId: string) => void;
  /** Handle an event from a micro-app */
  processPortalEvent: (event: PortalEvent) => void;
  hideModal: (modalId: string) => void;
  hideAllModalsFromApp: (appId: string) => void;
}

/**
 * Portal store implementation
 */
const usePortalStore = create<PortalState & PortalActions>()((set, get) => {
  // Create a local function to broadcast events
  const broadcastEvent = (type: PortalEventType, data: any) => {
    const apps = get().microApps;

    Object.values(apps).forEach((app) => {
      if (app.iframeRef?.contentWindow) {
        const event: PortalEvent = {
          type,
          data,
          sourceId: "portal",
          timestamp: Date.now(),
        };

        app.iframeRef.contentWindow.postMessage(event, "*");
      }
    });
  };

  // Create a local function to post message to a specific app
  const postMessageToApp = (
    appId: string,
    type: PortalEventType,
    data: any
  ) => {
    const app = get().microApps[appId];
    if (!app?.iframeRef?.contentWindow) return;

    const event: PortalEvent = {
      type,
      data,
      sourceId: "portal",
      targetId: appId,
      timestamp: Date.now(),
    };

    app.iframeRef.contentWindow.postMessage(event, "*");
  };

  return {
    // Initial state
    microApps: {},
    activeModals: [],
    modals: [],

    // App registration
    registerMicroApp: (app) =>
      set((state) => ({
        ...state,
        microApps: { ...state.microApps, [app.id]: app },
      })),

    setMicroAppIframeRef: (appId, iframeRef) =>
      set((state) => ({
        ...state,
        microApps: {
          ...state.microApps,
          [appId]: state.microApps[appId]
            ? { ...state.microApps[appId], iframeRef }
            : state.microApps[appId],
        },
      })),

    unregisterMicroApp: (appId) =>
      set((state) => {
        // If the app doesn't exist, return the state unchanged
        if (!state.microApps[appId]) {
          return state;
        }

        // Otherwise, remove the app from the state
        const { [appId]: _, ...rest } = state.microApps;
        return { ...state, microApps: rest };
      }),

    // Navigation security
    resetMicroAppToEntryPoint: (appId) => {
      const app = get().microApps[appId];
      if (!app || !app.iframeRef) return;

      // Construct the entry URL
      const entryUrl = PortalSecurity.getEntryPointUrl(app);

      // Navigate the iframe back to entry point
      app.iframeRef.src = entryUrl;

      // Notify the app about the reset
      if (app.iframeRef.contentWindow) {
        const event: PortalEvent = {
          type: PortalEventType.APP_ERROR,
          data: {
            error: "navigation_boundary_violation",
            message:
              "Navigation outside permitted internal routes detected. Resetting to entry point.",
          },
          sourceId: "portal",
          targetId: appId,
          timestamp: Date.now(),
        };

        app.iframeRef.contentWindow.postMessage(event, "*");
      }
    },

    // Modal management
    showModal: (modal) =>
      set((state) => ({
        ...state,
        activeModals: [...state.activeModals, modal],
        modals: [...state.modals, modal],
      })),

    closeModal: (modalId) =>
      set((state) => ({
        ...state,
        activeModals: state.activeModals.filter((m) => m.id !== modalId),
      })),

    hideModal: (modalId) =>
      set((state) => ({
        ...state,
        modals: state.modals.filter((m) => m.id !== modalId),
      })),

    hideAllModalsFromApp: (appId) =>
      set((state) => ({
        ...state,
        modals: state.modals.filter((m) => m.sourceAppId !== appId),
      })),

    // Event handling
    processPortalEvent: (event) => {
      const { type, data, sourceId, targetId } = event;

      switch (type) {
        case PortalEventType.NAVIGATE:
          // Check if this is an internal navigation (within the iframe) or a parent navigation request
          if (data.internal === true) {
            // Internal navigation within the micro-app's iframe
            const sourceApp = get().microApps[sourceId];
            if (sourceApp) {
              const isPermitted =
                PortalSecurity.validateInternalRoutePermission(
                  sourceApp,
                  data.routePath
                );

              if (isPermitted) {
                // Let the micro-app handle its own navigation
                // We just validate it's within permitted internal routes

                // Notify other apps about the route change if needed
                broadcastEvent(PortalEventType.ROUTE_CHANGED, {
                  appId: sourceId,
                  routePath: data.routePath,
                  internal: true,
                });
              } else {
                // Reset the app if it tries to navigate outside boundaries
                get().resetMicroAppToEntryPoint(sourceId);
              }
            }
          } else {
            // Parent-level navigation request (changing the browser URL)
            // This affects the entire application, not just the micro-app
            const sourceApp = get().microApps[sourceId];
            if (sourceApp) {
              const isPermitted = PortalSecurity.validateParentRoutePermission(
                sourceApp,
                data.routePath
              );

              if (isPermitted) {
                // Perform the parent navigation
                window.history.pushState({}, "", data.routePath);

                // Notify apps about the route change
                broadcastEvent(PortalEventType.ROUTE_CHANGED, {
                  routePath: data.routePath,
                  internal: false,
                  sourceId: sourceId,
                });
              } else {
                // Notify the app that the navigation was rejected
                postMessageToApp(sourceId, PortalEventType.APP_ERROR, {
                  error: "navigation_permission_denied",
                  message:
                    "Navigation to the requested parent route is not permitted",
                  routePath: data.routePath,
                });
              }
            }
          }
          break;

        case PortalEventType.SHOW_MODAL:
          get().showModal({
            id: data.id || `modal-${Date.now()}`,
            appId: sourceId,
            htmlContent: data.htmlContent,
            displayOptions: data.displayOptions,
          });
          break;

        case PortalEventType.CLOSE_MODAL:
          get().closeModal(data.id);
          break;

        case PortalEventType.SEND_MESSAGE:
          if (targetId && targetId !== "portal") {
            const targetApp = get().microApps[targetId];
            if (targetApp?.iframeRef?.contentWindow) {
              targetApp.iframeRef.contentWindow.postMessage(event, "*");
            }
          }
          break;
      }
    },
  };
});

// Export the store for React components
export { usePortalStore };
