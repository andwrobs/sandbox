import React, { useState, useEffect } from "react";
import { useMicroAppServiceStore } from "./micro-app.store";
import type { MicroAppServiceOptions } from "./micro-app.types";
import { MicroAppService } from "./micro-app.service";

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
