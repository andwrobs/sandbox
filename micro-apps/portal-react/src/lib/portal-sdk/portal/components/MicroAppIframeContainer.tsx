import React, { useState, useRef } from "react";
import { usePortalService } from "../use-portal";
import type { MicroApp } from "../portal.types";
import { PortalEventType } from "../portal.types";

export interface MicroAppContainerProps {
  app?: MicroApp;
  className?: string;
}

/**
 * Container component for micro-app iframes
 * Handles registration and lifecycle of micro-apps with the portal
 */
export function MicroAppIframeContainer({
  app,
  className = "",
}: MicroAppContainerProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const portalService = usePortalService();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Store the current app ID in state for cleanup
  const [currentAppId, setCurrentAppId] = useState<string | undefined>(app?.id);

  // Update the current app ID when the app changes
  React.useEffect(() => {
    if (app?.id) {
      setCurrentAppId(app.id);
    }
  }, [app?.id]);

  // Only register the app if it exists
  React.useEffect(() => {
    // Skip if app is undefined
    if (!app) return;

    // Register the micro-app with the portal
    portalService.registerMicroApp(app);

    // Set up event listener for app_ready events
    const unsubscribe = portalService.addEventListener((event) => {
      if (
        event.type === PortalEventType.APP_READY &&
        event.sourceId === app.id
      ) {
        setIsLoading(false);
      } else if (
        event.type === PortalEventType.APP_ERROR &&
        event.sourceId === app.id
      ) {
        setHasError(true);
        setIsLoading(false);
      }
    });

    // Clean up when the component unmounts or when the app changes
    return () => {
      unsubscribe();
      // Only unregister if we have a valid app ID
      if (currentAppId) {
        try {
          portalService.unregisterMicroApp(currentAppId);
        } catch (error) {
          console.error("Error unregistering micro-app:", error);
        }
      }
    };
  }, [app?.id, currentAppId, portalService]);

  // Only register the iframe if both app and iframe exist
  React.useEffect(() => {
    // Skip if app is undefined or iframe ref is not available
    if (!app || !iframeRef.current) return;

    // Register the iframe reference
    portalService.registerMicroAppIframe(app.id, iframeRef.current);

    // Handle iframe load event
    const handleIframeLoad = () => {
      // The iframe has loaded, but we're still waiting for the APP_READY event
      console.log(
        `Iframe for ${app.id} has loaded, waiting for APP_READY event`
      );
    };

    iframeRef.current.addEventListener("load", handleIframeLoad);

    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener("load", handleIframeLoad);
      }
    };
  }, [app?.id, portalService]);

  // If no app is provided, render a placeholder or nothing
  if (!app) {
    return (
      <div
        className={`w-full h-full bg-gray-100 flex items-center justify-center text-gray-500 ${className}`}
      >
        No micro-app configured
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p>Loading {app.name}...</p>
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100/80 z-10">
          <div className="bg-white p-4 rounded shadow-lg">
            <h3 className="text-red-500 font-bold">Error Loading Micro-App</h3>
            <p>There was a problem loading {app.name}.</p>
            <button
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                if (iframeRef.current) {
                  iframeRef.current.src = app.entryPoint;
                }
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={app.entryPoint}
        title={app.name}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
      />
    </div>
  );
}
