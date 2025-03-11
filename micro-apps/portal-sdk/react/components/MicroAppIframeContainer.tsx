import React, { useEffect, useCallback } from "react";
import { useIframeRefsStore, usePortalAppStore } from "../portal-app.react";

export function MicroAppIframeContainer({ appId }: { appId: string }) {
  const setIframeRef = useIframeRefsStore((state) => state.setIframeRef);
  const removeIframeRef = useIframeRefsStore((state) => state.removeIframeRef);
  const registeredApps = usePortalAppStore((state) => state.apps);
  const appConfig = registeredApps[appId];

  // Use a callback ref to detect when the iframe element is available
  const setRef = useCallback(
    (iframeRef: HTMLIFrameElement | null) => {
      if (iframeRef) {
        console.log("Iframe element is now available");
        setIframeRef(appId, iframeRef);
      }
    },
    [appId, setIframeRef]
  );

  // This effect handles cleanup when the component unmounts
  useEffect(() => {
    return () => {
      console.log("Cleaning up iframe ref");
      removeIframeRef(appId);
    };
  }, [appId, setIframeRef]);

  if (!appConfig) {
    return <div className="flex justify-center items-center">Loading...</div>;
  }

  return (
    <iframe
      ref={setRef}
      src={`${appConfig.baseUrl}${appConfig.entryPoint}`}
      className="w-full h-full"
    />
  );
}
