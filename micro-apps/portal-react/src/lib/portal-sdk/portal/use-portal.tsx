import { create } from "zustand";
import { PortalService } from "./portal.service";
import React from "react";

/**
 * State interface for the Portal Service store
 */
interface PortalServiceState {
  /**
   * The singleton PortalService instance
   */
  service: PortalService | null;

  /**
   * Whether the service has been initialized
   */
  isInitialized: boolean;
}

/**
 * Actions interface for the Portal Service store
 */
interface PortalServiceActions {
  /**
   * Gets the existing PortalService instance or creates a new one if none exists
   * @returns The PortalService instance
   */
  getOrCreateService: () => PortalService;

  /**
   * Marks the service as initialized
   */
  setInitialized: (value: boolean) => void;
}

/**
 * Initial state for the Portal Service store
 */
const initialState: PortalServiceState = {
  service: null,
  isInitialized: false,
};

/**
 * Store for managing the PortalService singleton
 * Uses Zustand to provide a centralized way to access the service
 */
export const usePortalServiceStore = create<
  PortalServiceState & PortalServiceActions
>()((set, get) => ({
  ...initialState,

  getOrCreateService: () => {
    if (!get().service) {
      set({ service: new PortalService() });
    }
    return get().service!;
  },

  setInitialized: (value: boolean) => {
    set({ isInitialized: value });
  },
}));

/**
 * React hook for using the Portal Service
 * @param options Configuration options
 * @returns The PortalService instance
 *
 * @example
 * // With debug logging
 * const portalService = usePortalService({ debug: true });
 */
export function usePortalService(options?: { debug?: boolean }): PortalService {
  // Get the service and initialization state from the store
  const service = usePortalServiceStore((state) => state.getOrCreateService());
  const isInitialized = usePortalServiceStore((state) => state.isInitialized);
  const setInitialized = usePortalServiceStore((state) => state.setInitialized);

  React.useEffect(() => {
    // Only initialize if not already initialized
    if (!isInitialized) {
      // Initialize the portal service
      service.initializeMessageHandling();
      setInitialized(true);

      if (options?.debug) {
        console.log("Portal Service initialized");
      }
    }

    // Clean up when the component unmounts
    return () => {
      // Only clean up if we're the last component using the service
      if (isInitialized) {
        service.cleanupMessageHandling();
        setInitialized(false);

        if (options?.debug) {
          console.log("Portal Service cleaned up");
        }
      }
    };
  }, [service, isInitialized, setInitialized, options?.debug]);

  return service;
}
