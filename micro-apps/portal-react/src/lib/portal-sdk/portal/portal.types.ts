/**
 * Event types supported by the portal system
 */
export enum PortalEventType {
  // App lifecycle
  APP_IFRAME_LOADED = "app:loaded",
  APP_READY = "app:ready",
  APP_ERROR = "app:error",

  // Navigation
  NAVIGATE = "navigation:navigate",
  ROUTE_CHANGED = "navigation:routeChanged",

  // UI/UX
  SHOW_MODAL = "ui:showModal",
  CLOSE_MODAL = "ui:closeModal",
  SHOW_TOAST = "ui:showToast",

  // App to app communication
  SEND_MESSAGE = "app:sendMessage",

  // Custom events
  CUSTOM = "custom",
}

/**
 * Basic configuration for a micro-app
 */
export type MicroApp = {
  /** Unique identifier for the micro-app */
  id: string;
  /** Display name of the micro-app */
  name: string;
  /** Base URL where the micro-app is hosted */
  baseUrl: string;
  /** Entry point path relative to baseUrl */
  entryPoint: string;
  /** Routes the micro-app is permitted to navigate to within its own iframe */
  permittedInternalRoutes: string[];
  /** Routes the micro-app is permitted to request the parent application to navigate to */
  permittedParentRoutes: string[];
  /** Reference to the iframe DOM element (set by the portal) */
  iframeRef?: HTMLIFrameElement;
};

/**
 * Structure for event messages between portal and micro-apps
 */
export type PortalEvent<T = any> = {
  /** Type of event */
  type: PortalEventType;
  /** Event data */
  data: T;
  /** Source identifier of the event (app ID or "portal") */
  sourceId: string;
  /** Optional target identifier for the event (app ID or "portal") */
  targetId?: string;
  /** Timestamp when the event was created */
  timestamp: number;
};

/**
 * Modal display options
 */
export interface ModalDisplayOptions {
  /** Whether to close the modal when clicking the overlay */
  closeOnOverlayClick?: boolean;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Width of the modal content */
  width?: string;
  /** Height of the modal content */
  height?: string;
  /** Additional styles for the modal content */
  contentStyle?: Record<string, any>;
  /** Additional styles for the close button */
  // closeButtonStyle?: Record<string, any>;
}

/**
 * Portal modal configuration
 */
export type PortalModal = {
  /** Unique identifier for the modal */
  id: string;
  /** ID of the app that created the modal */
  appId: string;
  /** Modal content (HTML string or React component) */
  htmlContent: string;
  /** Modal display options */
  displayOptions?: ModalDisplayOptions;
};
