import type { PortalEvent, PortalEventType } from "../portal/portal.types";
import React from "react";

/**
 * MicroApp service configuration options
 */
export interface MicroAppServiceOptions {
  /** The ID of the micro-app */
  appId: string;
  /** Debug mode flag */
  debug?: boolean;
  /** Version of the micro-app */
  version?: string;
  /** Features supported by the micro-app */
  features?: string[];
}

/**
 * Modal display options
 */
export interface ModalOptions {
  /** Modal ID (auto-generated if not provided) */
  id?: string;
  /** Modal content (HTML string or React component) */
  content: string | React.ReactNode;
  /** Modal width */
  width?: string;
  /** Modal height */
  height?: string;
  /** Whether to close the modal when clicking the overlay */
  closeOnOverlayClick?: boolean;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Additional styles for the modal content */
  contentStyle?: React.CSSProperties;
}
