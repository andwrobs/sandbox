import type { Route } from "./+types/home";
import { href, NavLink, Outlet, useNavigate } from "react-router";
import React, { useEffect } from "react";
import { SidePanel } from "../components/side-panel";
import {
  usePortalService,
  usePortalStore,
  PortalModalRenderer,
  PortalEventType,
} from "../lib/portal-sdk";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Micro-Apps Portal" },
    { name: "description", content: "Portal for micro-frontend applications" },
  ];
}

/**
 * Main layout component for the micro-apps portal
 */
export default function PortalLayout() {
  // Initialize the Portal Service at the layout level
  const portalService = usePortalService({ debug: true });

  // Get the microApps from the store to check if they're already registered
  const microApps = usePortalStore((state) => state.microApps);

  let navigate = useNavigate();

  // Register micro-apps when the component mounts
  useEffect(() => {
    // Only register if the apps don't already exist in the store
    if (!microApps["micro-app-a"]) {
      portalService.registerMicroApp({
        id: "micro-app-a",
        name: "Micro-App A",
        baseUrl: "http://localhost:5174/micro-app-a",
        entryPoint: "http://localhost:5174/micro-app-a/",
        permittedInternalRoutes: ["/", "/dashboard", "/profile"],
        permittedParentRoutes: ["/micro-app-b", "/settings"],
      });
    }

    if (!microApps["micro-app-b"]) {
      portalService.registerMicroApp({
        id: "micro-app-b",
        name: "Micro-App B (Angular)",
        baseUrl: "http://localhost:4200",
        entryPoint: "http://localhost:4200/",
        permittedInternalRoutes: ["/", "/home", "/profile"],
        permittedParentRoutes: ["/micro-app-a", "/settings"],
      });
    }

    // Set up event listener for ALL events from micro-apps
    const unsubscribe = portalService.addEventListener((event) => {
      console.log("Portal received event:", event);

      // Handle APP_READY events
      if (event.type === PortalEventType.APP_READY) {
        console.log(`Micro-app ${event.sourceId} is ready!`, event.data);

        // First, send the APP_IFRAME_LOADED event with permissions
        portalService.postMessageToApp(
          event.sourceId,
          PortalEventType.APP_IFRAME_LOADED,
          {
            appId: event.sourceId,
            permittedInternalRoutes:
              microApps[event.sourceId]?.permittedInternalRoutes || [],
            permittedParentRoutes:
              microApps[event.sourceId]?.permittedParentRoutes || [],
            initialData: {
              user: { id: "user123", name: "Test User" },
              theme: "light",
            },
          }
        );

        // Then send the custom welcome message
        portalService.postMessageToApp(event.sourceId, PortalEventType.CUSTOM, {
          message: "Welcome to the portal!",
        });
      }
      // Handle CUSTOM events from micro-apps
      else if (event.type === PortalEventType.CUSTOM) {
        console.log(
          `Received custom message from ${event.sourceId}:`,
          event.data
        );

        // Respond to the custom message
        portalService.postMessageToApp(event.sourceId, PortalEventType.CUSTOM, {
          message: "Message received by portal!",
          receivedTimestamp: new Date().toISOString(),
          originalMessage: event.data,
        });
      }
      // Handle NAVIGATE events
      else if (event.type === PortalEventType.NAVIGATE) {
        console.log(
          `Navigation request from ${event.sourceId} to:`,
          event.data.routePath
        );

        // Check if the app has permission to navigate to this route
        const app = microApps[event.sourceId];
        if (app && app.permittedParentRoutes.includes(event.data.routePath)) {
          // Use the router to navigate
          // This would typically use something like navigate(event.data.route)
          console.log(
            "Navigation permitted, redirecting to:",
            event.data.routePath
          );

          navigate(event.data.routePath);

          // Send confirmation back to the app
          portalService.postMessageToApp(
            event.sourceId,
            PortalEventType.CUSTOM,
            {
              message: "Navigation successful",
              route: event.data.routePath,
            }
          );
        } else {
          console.error("Navigation not permitted:", event.data.routePath);

          // Send error back to the app
          portalService.postMessageToApp(
            event.sourceId,
            PortalEventType.CUSTOM,
            {
              message: "Navigation denied - permission error",
              route: event.data.routePath,
              error: "You don't have permission to navigate to this route",
            }
          );
        }
      }
      // Handle SHOW_MODAL events
      else if (event.type === PortalEventType.SHOW_MODAL) {
        console.log(`Modal request from ${event.sourceId}:`, event.data);

        // Use the store directly to show the modal
        const modalId = `modal-${Date.now()}`;
        usePortalStore.getState().showModal({
          id: modalId,
          appId: event.sourceId,
          htmlContent: event.data.content || "",
          displayOptions: {
            width: event.data.width || "400px",
            height: event.data.height || "300px",
            contentStyle: {
              padding: "1rem",
            },
          },
        });
      }
      // Handle HIDE_MODAL events
      else if (event.type === PortalEventType.CLOSE_MODAL) {
        console.log(`Hide modal request from ${event.sourceId}:`, event.data);

        // Use the store directly to hide the modal
        if (event.data.modalId) {
          usePortalStore.getState().hideModal(event.data.modalId);
        } else {
          // If no specific modal ID, close all modals from this app
          usePortalStore.getState().hideAllModalsFromApp(event.sourceId);
        }
      }
    });

    // Clean up event listener on unmount
    return () => {
      unsubscribe();
    };
  }, [portalService, microApps]);

  return (
    <div className="w-full h-full flex flex-col border-dashed border-8 border-blue-500 overflow-hidden">
      <div className="flex-1 grid grid-cols-[1fr_auto] overflow-hidden">
        <div className="flex overflow-hidden">
          <div className="flex-none">
            <Sidebar />
          </div>
          <div className="flex-1 relative p-6 overflow-auto">
            <Outlet />
            {/* Render modals from micro-apps */}
            <PortalModalRenderer />
          </div>
        </div>
        {/* Side panel */}
        <SidePanel />
      </div>
    </div>
  );
}

/**
 * Navigation link item props for the sidebar
 */
type NavItemProps = {
  to: string;
  children: React.ReactNode;
};

/**
 * Navigation link component with consistent styling
 */
const NavItem = ({ to, children }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `p-2 rounded-lg text-left transition-colors flex items-center gap-3 ${
        isActive
          ? "bg-blue-900 text-blue-100 dark:bg-blue-800 dark:text-blue-100"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`
    }
  >
    {children}
  </NavLink>
);

/**
 * Header component for the portal
 */
const PortalHeader = () => (
  <>
    <span className="inline-flex items-center gap-2">
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
        alt=""
        className="w-12"
      />
      <span>Micro-Apps Portal</span>
    </span>
    <div className="w-full border-b-4 border-dashed pt-6" />
  </>
);

// Define a type for the app IDs
type AppId = "micro-app-a" | "micro-app-b";

/**
 * Navigation group component containing all nav items
 */
const NavGroup = () => {
  // Get registered micro-apps from the store
  const microApps = usePortalStore((state) => state.microApps);

  // Create a sorted array of micro-apps to ensure consistent order
  const sortedApps = Object.values(microApps).sort((a, b) => {
    // Sort by a predefined order or by ID
    const appOrder: Record<AppId, number> = {
      "micro-app-a": 1,
      "micro-app-b": 2,
      // Add more apps here as needed
    };

    // Use type assertion to tell TypeScript these are valid keys
    return (appOrder[a.id as AppId] || 999) - (appOrder[b.id as AppId] || 999);
  });

  return (
    <nav className="flex flex-col gap-2 pt-4">
      {sortedApps.map((app) => (
        <NavItem key={app.id} to={`/${app.id}`}>
          <img
            src={
              app.id === "micro-app-a"
                ? "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
                : "https://upload.wikimedia.org/wikipedia/commons/c/cf/Angular_full_color_logo.svg"
            }
            alt=""
            className="w-6 h-6"
          />
          <span>{app.name}</span>
        </NavItem>
      ))}
    </nav>
  );
};

/**
 * Sidebar component containing header and navigation
 */
const Sidebar = () => (
  <div className="flex flex-col gap-2 p-6">
    <PortalHeader />
    <NavGroup />
  </div>
);
