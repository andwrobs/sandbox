import { Outlet, useNavigate } from "react-router";

import type { Route } from "./+types/home";
import { AppNavbar } from "src/components/app-navbar";
import { usePortalAppStore } from "../../../portal-sdk/react/portal-app.react";
import { useEffect } from "react";
import { PortalModal } from "src/components/portal-modal";
import { SidePanel } from "src/components/side-panel";

const DUMMY_USER_SESSION = {
  user: {
    firstName: "Micro",
    lastName: "App",
    email: "micro-app-a@gmail.com",
    countryCode: "US",
    telephoneNumber: "000-000-0000",
    userReference: "Example",
  },
  token: "TEST_TOKEN",
};
/**
 * Main layout component for the micro-apps portal
 */
export default function PortalLayout() {
  const navigate = useNavigate();
  const initialize = usePortalAppStore((state) => state.initialize);
  const destroy = usePortalAppStore((state) => state.destroy);

  useEffect(() => {
    const init = async () => {
      await initialize({
        apps: {
          "micro-app-a": {
            id: "micro-app-a",
            name: "Micro-App A - React",
            version: "0.0.0",
            baseUrl: "http://localhost:7001",
            entryPoint: "/micro-app-a",
            permittedInternalRoutes: ["/", "/accounts"],
            permittedParentRoutes: ["/micro-app-b"],
            portalContext: {
              userSession: DUMMY_USER_SESSION,
            },
          },
          "micro-app-b": {
            id: "micro-app-b",
            name: "Micro-App B - React",
            version: "0.0.0",
            baseUrl: "http://localhost:4200",
            entryPoint: "/",
            permittedInternalRoutes: ["/"],
            permittedParentRoutes: ["/micro-app-b"],
            portalContext: {
              userSession: DUMMY_USER_SESSION,
            },
          },
        },
        navigate: (routePath) => navigate(routePath),
      });
    };

    init();

    return () => {
      destroy();
    };
  }, [initialize, destroy]);

  return (
    <div className="w-full h-full grid grid-cols-[auto_1fr_auto] border-dashed border-8 border-blue-500 overflow-hidden py-6">
      <AppNavbar />
      <div className="px-6">
        <Outlet />
      </div>
      <SidePanel />
      <PortalModal />
    </div>
  );
}
