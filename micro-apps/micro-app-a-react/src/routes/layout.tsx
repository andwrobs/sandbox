import React, { useEffect, useState } from "react";
import type { MicroApp } from "@andwrobs/portal-sdk";
import { useMicroAppStore } from "@andwrobs/portal-sdk/react";
import { Outlet } from "react-router";
import { BottomPanel } from "../components/bottom-panel";

export default function Home() {
  const app = useMicroAppStore((state) => state.app);
  const initialize = useMicroAppStore((state) => state.initialize);
  const destroy = useMicroAppStore((state) => state.destroy);

  useEffect(() => {
    const init = async () => {
      await initialize({ id: "micro-app-a" });
    };

    init();

    return () => {
      destroy();
    };
  }, [initialize, destroy]);

  const isConnected = !!app; // Simple check if app exists

  return (
    <div className="w-full h-full p-6 flex-1 flex flex-col gap-6 border-dashed border-8 border-sky-500 ">
      {app ? (
        <>
          <AppHeader app={app} isConnected={isConnected} />
          <div className="flex-1 overflow-y-scroll">
            <Outlet />
          </div>
          <BottomPanel />
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

interface AppHeaderProps {
  app: MicroApp;
  isConnected: boolean;
}

function AppHeader({ app, isConnected }: AppHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-blue-100 p-3 rounded-full">
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
        <h1 className="text-2xl font-bold text-gray-800">{app.name}</h1>
        <p className="text-gray-600">
          {isConnected ? "Connected to Portal" : "Connecting to Portal..."}
        </p>
      </div>
    </div>
  );
}
