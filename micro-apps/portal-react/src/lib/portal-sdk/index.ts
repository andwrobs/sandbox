/**
 * Portal SDK
 *
 * This SDK provides tools for building a micro-frontend architecture with React.
 * It includes:
 * - Core types and interfaces
 * - Portal Service API for parent applications
 * - MicroApp Service API for micro-apps
 * - React components for rendering micro-apps and modals
 */

// Export core types
export * from "./portal/portal.types";

// Export Portal Service API for parent applications
export { PortalService } from "./portal/portal.service";
export { usePortalStore } from "./portal/portal.store";
export { usePortalService } from "./portal/use-portal";

// Export MicroApp Service API for micro-apps
export {
  MicroAppService,
  useMicroAppService,
} from "./micro-app/micro-app.service";

// Export React components
export { MicroAppIframeContainer } from "./portal/components/MicroAppIframeContainer";
export { PortalModalRenderer } from "./portal/components/ModalContainer";

// Export security utilities
export { PortalSecurity } from "./portal/portal.security";

// Export example code
// These are not meant to be imported directly, but serve as reference implementations
// export * as MicroAppExample from "./examples/micro-app-example";
