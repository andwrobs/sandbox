import React, { useEffect, useState } from "react";
import type { MicroApp } from "@andwrobs/portal-sdk";
import { useMicroAppStore } from "@andwrobs/portal-sdk/react";
import { useNavigate } from "react-router";

export default function Home() {
  const app = useMicroAppStore((state) => state.app);
  const navigateWithinApp = useMicroAppStore(
    (state) => state.navigateWithinApp
  );
  const navigateParentApp = useMicroAppStore(
    (state) => state.navigateParentApp
  );
  const navigate = useNavigate();
  const showModal = useMicroAppStore((state) => state.showModal);

  const postMessageToPortal = useMicroAppStore(
    (state) => state.postMessageToPortal
  );

  const handleNavigateInternal = (routePath: string) => {
    navigateWithinApp(routePath); // alert parent app
    navigate(routePath);
  };

  const handleNavigateToAppB = () => {
    navigateParentApp("/micro-app-b");
  };

  const handleSendMessage = () => {
    postMessageToPortal({
      type: "app:ready", // Using a known event type
      data: {
        message: "Hello from Micro App A - " + new Date().toISOString(),
      },
    });
  };

  const handleOpenModal = () => {
    showModal({
      title: "Micro App A Modal",
      body: "This is a modal opened from Micro App A",
    });
  };

  const isConnected = !!app; // Simple check if app exists

  if (!app) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AppInfoCard app={app} isConnected={isConnected} />
        <NavigationPermissionsCard app={app} />
      </div>

      <ActionsCard
        isConnected={isConnected}
        handleNavigateInternal={handleNavigateInternal}
        onNavigateToAppB={handleNavigateToAppB}
        onSendMessage={handleSendMessage}
        onOpenModal={handleOpenModal}
      />

      <InitialDataDisplay initialData={app.portalContext} />
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

interface AppInfoCardProps {
  app: MicroApp;
  isConnected: boolean;
}

function AppInfoCard({ app, isConnected }: AppInfoCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        Micro App Info
      </h2>
      <div className="space-y-2">
        <div>
          <span className="text-gray-500">App ID: </span>
          <span className="font-mono">{app.id}</span>
        </div>
        <div>
          <span className="text-gray-500">Connection Status: </span>
          <span
            className={`font-medium ${
              isConnected ? "text-green-500" : "text-yellow-500"
            }`}
          >
            {isConnected ? "Connected" : "Connecting..."}
          </span>
        </div>
      </div>
    </div>
  );
}

interface NavigationPermissionsCardProps {
  app: MicroApp;
}

function NavigationPermissionsCard({ app }: NavigationPermissionsCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        Navigation Permissions
      </h2>
      <div className="flex flex-col gap-4">
        <RoutesList
          title="Internal Routes:"
          routes={app.permittedInternalRoutes}
          keyPrefix="internal"
        />
        <RoutesList
          title="Parent Routes:"
          routes={app.permittedParentRoutes}
          keyPrefix="parent"
        />
      </div>
    </div>
  );
}

interface RoutesListProps {
  title: string;
  routes: string[] | undefined;
  keyPrefix: string;
}

function RoutesList({ title, routes, keyPrefix }: RoutesListProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      {routes && routes.length > 0 ? (
        <ul className="list-disc list-inside text-sm font-mono">
          {routes.map((route, index) => (
            <li key={`${keyPrefix}-${index}`} className="text-gray-700">
              {route}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 italic">Loading routes...</p>
      )}
    </div>
  );
}

interface ActionsCardProps {
  isConnected: boolean;
  handleNavigateInternal: (routePath: string) => void;
  onNavigateToAppB: () => void;
  onSendMessage: () => void;
  onOpenModal: () => void;
}

function ActionsCard({
  isConnected,
  handleNavigateInternal,
  onNavigateToAppB,
  onSendMessage,
  onOpenModal,
}: ActionsCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Actions</h2>
      <div className="flex flex-wrap gap-3">
        <ActionButton
          label="Navigate internal to /123"
          onClick={() => handleNavigateInternal("/accounts")}
          disabled={!isConnected}
          className="bg-indigo-500 hover:bg-indigo-600"
        />
        <ActionButton
          label="Navigate parent to /micro-app-b"
          onClick={onNavigateToAppB}
          disabled={!isConnected}
          className="bg-blue-500 hover:bg-blue-600"
        />
        <ActionButton
          label="Send Message to Portal"
          onClick={onSendMessage}
          disabled={!isConnected}
          className="bg-purple-500 hover:bg-purple-600"
        />
        <ActionButton
          label="Open Modal"
          onClick={onOpenModal}
          disabled={!isConnected}
          className="bg-green-500 hover:bg-green-600"
        />
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  disabled: boolean;
  className: string;
}

function ActionButton({
  label,
  onClick,
  disabled,
  className,
}: ActionButtonProps) {
  return (
    <button
      className={`px-4 py-2 ${className} text-white rounded-md transition-colors cursor-pointer`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

interface InitialDataDisplayProps {
  initialData: unknown;
}

export function InitialDataDisplay({ initialData }: InitialDataDisplayProps) {
  if (!initialData) {
    return <div className="text-gray-500">No initial data received yet</div>;
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Initial Data from Portal</h3>
      <pre className="text-sm">{JSON.stringify(initialData, null, 2)}</pre>
    </div>
  );
}
