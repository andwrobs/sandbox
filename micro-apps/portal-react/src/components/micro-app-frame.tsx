import { useRef, useState, useEffect } from "react";
import { PortalService } from "../lib/portal-sdk/portal/portal.service";
import type { MicroApp } from "../lib/portal-sdk/portal/portal.types";

interface MicroAppFrameProps {
  /** URL where the micro-app is being served */
  appUrl: string;
  /** Title for the iframe (important for accessibility) */
  title: string;
  /** Optional className to apply to the iframe */
  className?: string;
  /** Callback fired when iframe successfully loads */
  onLoad?: () => void;
  /** Callback fired if iframe fails to load */
  onError?: (error: Error) => void;
  /** Minimum loading time in ms (default: 3000) */
  minLoadTime?: number;
  /** App ID (defaults to URL-based ID if not provided) */
  appId?: string;
  /** Debug mode flag */
  debug?: boolean;
  /** Permitted internal routes (defaults to ["*"]) */
  permittedInternalRoutes?: string[];
  /** Permitted parent routes (defaults to []) */
  permittedParentRoutes?: string[];
}

/**
 * MicroAppFrame is a wrapper component for iframes that provides:
 * - Loading state management with minimum load time
 * - URL management with proper base URL handling
 * - Error handling
 * - TypeScript support
 * - Accessibility features
 * - Integration with Portal SDK
 */
export function MicroAppFrame({
  appUrl,
  title,
  className = "",
  onLoad,
  onError,
  minLoadTime = 3000,
  appId,
  debug = false,
  permittedInternalRoutes = ["*"],
  permittedParentRoutes = [],
}: MicroAppFrameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadStartTime] = useState(Date.now());
  const [hasIframeLoaded, setHasIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate app ID from URL if not provided
  const generatedAppId = useRef(
    appId || `app-${appUrl.replace(/[^a-z0-9]/gi, "-")}`
  ).current;

  // Parse URL to get base URL and entry point
  const urlParts = useRef(() => {
    try {
      const url = new URL(appUrl);
      return {
        baseUrl: `${url.protocol}//${url.host}`,
        entryPoint: url.pathname,
      };
    } catch (e) {
      console.error("Invalid app URL:", appUrl);
      return { baseUrl: "", entryPoint: "" };
    }
  }).current();

  // Create micro-app config
  const microAppConfig = useRef<MicroApp>({
    id: generatedAppId,
    name: title,
    baseUrl: urlParts.baseUrl,
    entryPoint: urlParts.entryPoint,
    permittedInternalRoutes,
    permittedParentRoutes,
  }).current;

  // Register with Portal Service and set up cleanup
  useEffect(() => {
    // Register the app with the Portal Service
    PortalService.registerMicroApp(microAppConfig);

    if (debug) {
      console.log(`[MicroAppFrame] Registered app: ${generatedAppId}`);
    }

    // Clean up on unmount
    return () => {
      PortalService.unregisterMicroApp(generatedAppId);
      if (debug) {
        console.log(`[MicroAppFrame] Unregistered app: ${generatedAppId}`);
      }
    };
  }, [generatedAppId, microAppConfig, debug]);

  // Handle iframe load and register it with Portal Service
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      console.log(`[MicroAppFrame] Iframe loaded: ${generatedAppId}`);

      // Register the iframe with the Portal Service
      PortalService.registerMicroAppIframe(generatedAppId, iframe);

      setHasIframeLoaded(true);
      onLoad?.();
    };

    iframe.addEventListener("load", handleIframeLoad);

    return () => {
      iframe.removeEventListener("load", handleIframeLoad);
    };
  }, [generatedAppId, onLoad]);

  // Handle minimum load time
  useEffect(() => {
    if (!hasIframeLoaded) return;

    const timeElapsed = Date.now() - loadStartTime;
    const remainingTime = Math.max(0, minLoadTime - timeElapsed);

    if (remainingTime > 0) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [hasIframeLoaded, loadStartTime, minLoadTime]);

  const handleError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    console.log("Iframe error occurred:", e);
    setHasIframeLoaded(true);
    setIsLoading(false);
    onError?.(new Error("Failed to load iframe content"));
  };

  return (
    <div className="flex flex-col relative w-full flex-1">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-1 items-center justify-center bg-gray-100/10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500" />
        </div>
      )}

      {/* Main iframe - hidden until loading is complete */}
      <iframe
        ref={iframeRef}
        src={appUrl}
        className={`w-full flex-1 ${className} ${
          isLoading ? "invisible" : "visible"
        }`}
        title={title}
        onError={handleError}
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}
