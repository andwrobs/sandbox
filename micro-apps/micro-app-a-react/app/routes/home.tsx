import type { Route } from "./+types/home";
import { useEffect, useState } from "react";
import {
  useMicroAppService,
  PortalEventType,
} from "../../../portal-react/src/lib/portal-sdk";
import React from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Micro App A" },
    { name: "description", content: "Micro App A using Portal SDK" },
  ];
}

export default function Home() {
  const APP_ID = "micro-app-a";

  // Use the hook to get and manage the service instance
  const microAppService = useMicroAppService({
    appId: APP_ID,
    debug: true,
  });

  // State for app information
  const [appInfo, setAppInfo] = useState({
    id: "Loading...",
    name: "Loading...",
    permittedInternalRoutes: [] as string[],
    permittedParentRoutes: [] as string[],
    connected: false,
  });

  // Add state for initial data
  const [initialData, setInitialData] = useState<any>(null);

  // Set up event listeners for portal communication
  useEffect(() => {
    console.log("Setting up portal communication...");

    // Update connection status when the portal responds
    const handlePortalMessage = (event: CustomEvent) => {
      console.log("Received portal message:", event.detail);
      const portalEvent = event.detail;

      if (portalEvent.type === PortalEventType.APP_IFRAME_LOADED) {
        console.log("Received APP_IFRAME_LOADED event:", portalEvent);
        // The portal has acknowledged our app and sent permissions
        setAppInfo({
          id: APP_ID,
          name: "Micro App A",
          permittedInternalRoutes: microAppService.getPermittedInternalRoutes(),
          permittedParentRoutes: microAppService.getPermittedParentRoutes(),
          connected: true,
        });

        // Store initial data if available
        if (portalEvent.data && portalEvent.data.initialData) {
          setInitialData(portalEvent.data.initialData);
        }
      } else if (portalEvent.type === PortalEventType.CUSTOM) {
        console.log("Received custom message from portal:", portalEvent.data);
      }
    };

    // Add event listener for portal messages
    window.addEventListener(
      "portal-message",
      handlePortalMessage as EventListener
    );

    // Send APP_READY event to the portal to initiate the connection
    console.log("Sending APP_READY event to portal");
    microAppService.postMessageToPortal(PortalEventType.APP_READY, {
      appId: APP_ID,
      version: "1.0.0",
    });

    // Clean up event listener on unmount
    return () => {
      console.log("Cleaning up portal communication...");
      window.removeEventListener(
        "portal-message",
        handlePortalMessage as EventListener
      );
    };
  }, []); // Empty dependency array to run only once

  // Handle navigation to App B
  const handleNavigateToAppB = () => {
    microAppService.navigateParentApplication("/micro-app-b");
  };

  // Handle sending a message to the portal
  const handleSendMessage = () => {
    microAppService.postMessageToPortal(PortalEventType.CUSTOM, {
      message: "Hello from Micro App A!",
      timestamp: new Date().toISOString(),
    });
  };

  // Add this function to your component
  const handleOpenModal = () => {
    console.log("Opening modal from micro-app");
    microAppService.postMessageToPortal(PortalEventType.SHOW_MODAL, {
      title: "Example Modal from Micro-App A",
      content: `
        <div class="p-4">
          <h2 class="text-xl font-bold mb-4">This is a modal from Micro-App A</h2>
          <p class="mb-4">This modal is rendered by the portal but controlled by the micro-app.</p>
          <p class="mb-2">Current time: ${new Date().toLocaleTimeString()}</p>
          <div class="flex justify-end mt-6">
            <button 
              id="modal-close-btn" 
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close Modal
            </button>
          </div>
        </div>
      `,
      width: "500px",
      height: "auto",
    });
  };

  // Add this effect to handle modal events
  useEffect(() => {
    const handlePortalMessage = (event: CustomEvent) => {
      const portalEvent = event.detail;

      if (portalEvent.type === PortalEventType.MODAL_ACTION) {
        console.log("Modal action received:", portalEvent.data);
        // Handle any modal actions here
        if (portalEvent.data.action === "close") {
          console.log("Modal was closed");
        } else if (portalEvent.data.action === "button-click") {
          console.log(
            "Button was clicked in modal:",
            portalEvent.data.buttonId
          );
        }
      }
    };

    window.addEventListener(
      "portal-message",
      handlePortalMessage as EventListener
    );

    return () => {
      window.removeEventListener(
        "portal-message",
        handlePortalMessage as EventListener
      );
    };
  }, []);

  return (
    <div className="shadow-md rounded-lg p-6 overflow-y-auto">
      <div className="flex items-center mb-6">
        <div className="bg-blue-100 p-3 rounded-full mr-4">
          <svg
            className="w-8 h-8 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            ></path>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{appInfo.name}</h1>
          <p className="text-gray-600">
            {appInfo.connected
              ? "Connected to Portal"
              : "Connecting to Portal..."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">
            Micro App Info
          </h2>
          <div className="space-y-2">
            <div>
              <span className="text-gray-500">App ID: </span>
              <span className="font-mono">{appInfo.id}</span>
            </div>
            <div>
              <span className="text-gray-500">Connection Status: </span>
              <span
                className={`font-medium ${
                  appInfo.connected ? "text-green-500" : "text-yellow-500"
                }`}
              >
                {appInfo.connected ? "Connected" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">
            Navigation Permissions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Internal Routes:
              </h3>
              {appInfo.permittedInternalRoutes.length > 0 ? (
                <ul className="list-disc list-inside text-sm font-mono">
                  {appInfo.permittedInternalRoutes.map((route, index) => (
                    <li key={`internal-${index}`} className="text-gray-700">
                      {route}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Loading routes...
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Parent Routes:
              </h3>
              {appInfo.permittedParentRoutes.length > 0 ? (
                <ul className="list-disc list-inside text-sm font-mono">
                  {appInfo.permittedParentRoutes.map((route, index) => (
                    <li key={`parent-${index}`} className="text-gray-700">
                      {route}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Loading routes...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            onClick={handleNavigateToAppB}
            disabled={!appInfo.connected}
          >
            Navigate to Micro App B
          </button>

          <button
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md transition-colors"
            onClick={handleSendMessage}
            disabled={!appInfo.connected}
          >
            Send Message to Portal
          </button>

          <button
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
            onClick={handleOpenModal}
            disabled={!appInfo.connected}
          >
            Open Modal
          </button>
        </div>
      </div>

      <div className="mt-6">
        <InitialDataDisplay initialData={initialData} />
      </div>
    </div>
  );
}

interface InitialDataDisplayProps {
  initialData: any;
}

export function InitialDataDisplay({ initialData }: InitialDataDisplayProps) {
  if (!initialData) {
    return <div className="text-gray-500">No initial data received yet</div>;
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg mt-4">
      <h3 className="text-lg font-semibold mb-2">Initial Data from Portal</h3>
      <div className="overflow-auto max-h-60">
        <pre className="text-sm">{JSON.stringify(initialData, null, 2)}</pre>
      </div>
    </div>
  );
}
