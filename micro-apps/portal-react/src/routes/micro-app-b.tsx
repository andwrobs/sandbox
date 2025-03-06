import { isRouteErrorResponse } from "react-router";
import type { Route } from "./+types/micro-app-b";
import { MicroAppIframeContainer, usePortalStore } from "../lib/portal-sdk";

export const clientLoader = async ({}: Route.ClientLoaderArgs) => {
  return {};
};

export default function MicroAppB() {
  // Get the micro-app configuration from the portal store
  const microApp = usePortalStore((state) => state.microApps["micro-app-b"]);

  if (!microApp) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center">
        <p className="text-red-500">
          Micro-App B is not registered in the portal.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-2 border-dashed border-8 border-purple-400 p-6">
      <MicroAppIframeContainer
        app={microApp}
        // className="w-full h-full"
      />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

// helper components
function MicroAppBLabel() {
  return (
    <div className="flex gap-2">
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/c/cf/Angular_full_color_logo.svg"
        alt=""
        className="w-6 h-6"
      />
      <span>Micro-App B</span>
    </div>
  );
}
