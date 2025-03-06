import { create } from "zustand";
import { MicroAppService } from "./micro-app.service";
import type { MicroAppServiceOptions } from "./micro-app.types";

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
