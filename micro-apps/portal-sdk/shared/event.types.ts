import { z } from "zod";
import { userSessionSchema, microAppSchema } from "./core.types";

/**
 * Event types supported by the portal system
 * @description Constants defining all possible event types in the portal communication system
 */
export const PortalEventTypes = {
  // App Lifecycle
  /** Event sent when a micro-app is ready to receive messages */
  APP_READY: "app:ready",
  /** Event sent when a micro-app encounters an error */
  APP_ERROR: "app:error",

  // Portal Lifecycle
  /** Event sent by the portal to initialize a micro-app */
  PORTAL_INIT_APP: "portal:init_app",
  /** Event sent when internal navigation violates boundaries */
  PORTAL_NAVIGATION_ERROR_INTERNAL: "portal:internal_navigation_error",
  /** Event sent when parent navigation violates boundaries */
  PORTAL_NAVIGATION_ERROR_PARENT: "portal:parent_navigation_error",

  // App->Portal Navigation
  /** Event sent when a micro-app wants to navigate internally */
  APP_NAVIGATE_INTERNAL: "app:navigation:internal",
  /** Event sent when a micro-app wants the parent to navigate */
  APP_NAVIGATE_PARENT: "app:navigation:parent",

  // App->Portal UI control
  /** Event sent when a micro-app wants to show a modal */
  APP_SHOW_MODAL: "app:modal:show",
  /** Event sent when a micro-app wants to close a modal */
  APP_CLOSE_MODAL: "app:modal:close",
} as const;

/**
 * Schema for modal content
 * @description Defines the structure of content displayed in a modal
 */
const portalModalContentSchema = z.object({
  /** Modal title */
  title: z.string(),
  /** Modal body content */
  body: z.string(),
});

/**
 * Schema for modal display options
 * @description Defines optional configuration for how modals are displayed
 */
const portalModalDisplayOptionsSchema = z
  .object({
    /** Modal size variant */
    size: z.enum(["small", "medium", "large"]).optional(),
    /** Whether clicking outside the modal should close it */
    closeOnClickOutside: z.boolean().optional(),
  })
  .optional();

/**
 * Schema for APP_READY event payload
 * @description Data sent when a micro-app is ready
 */
const appReadyPayloadSchema = z.object({
  /** Status message */
  message: z.string(),
});

/**
 * Schema for APP_ERROR event payload
 * @description Data sent when a micro-app encounters an error
 */
const appErrorPayloadSchema = z.object({
  /** Error type */
  error: z.string(),
  /** Error message */
  message: z.string(),
});

/**
 * Schema for PORTAL_INIT_APP event payload
 * @description Data sent by the portal to initialize a micro-app
 */
const portalAppInitPayloadSchema = microAppSchema;

/**
 * Schema for navigation error payloads
 * @description Data sent when navigation violates boundaries
 */
const portalNavigationErrorSchema = z.object({
  /** Type of navigation error */
  error: z.enum([
    "internal_navigation_boundary_violation",
    "parent_navigation_boundary_violation",
  ]),
  /** Error message */
  message: z.string(),
  /** Route path that caused the error */
  routePath: z.string(),
});

/**
 * Schema for APP_NAVIGATE_INTERNAL event payload
 * @description Data sent when a micro-app wants to navigate internally
 */
const navigateInternalPayloadSchema = z.object({
  /** Route path to navigate to */
  routePath: z.string(),
});

/**
 * Schema for APP_NAVIGATE_PARENT event payload
 * @description Data sent when a micro-app wants the parent to navigate
 */
const navigateParentPayloadSchema = z.object({
  /** Route path for the parent to navigate to */
  routePath: z.string(),
});

/**
 * Schema for APP_SHOW_MODAL event payload
 * @description Data sent when a micro-app wants to show a modal
 */
const showModalPayloadSchema = z.object({
  /** Modal content */
  content: portalModalContentSchema,
  /** Optional display configuration */
  displayOptions: portalModalDisplayOptionsSchema,
});

/**
 * Schema for APP_CLOSE_MODAL event payload
 * @description Data sent when a micro-app wants to close a modal
 */
const closeModalPayloadSchema = z.object({
  /** Status message */
  message: z.string(),
});

/**
 * Schema for portal events
 * @description Discriminated union of all possible event types and their payloads
 */
const portalEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(PortalEventTypes.APP_READY),
    data: appReadyPayloadSchema,
  }),
  z.object({
    type: z.literal(PortalEventTypes.APP_ERROR),
    data: appErrorPayloadSchema,
  }),
  z.object({
    type: z.literal(PortalEventTypes.PORTAL_INIT_APP),
    data: portalAppInitPayloadSchema,
  }),
  z.object({
    type: z.literal(PortalEventTypes.PORTAL_NAVIGATION_ERROR_INTERNAL),
    data: portalNavigationErrorSchema,
  }),
  z.object({
    type: z.literal(PortalEventTypes.PORTAL_NAVIGATION_ERROR_PARENT),
    data: portalNavigationErrorSchema,
  }),
  z.object({
    type: z.literal(PortalEventTypes.APP_NAVIGATE_INTERNAL),
    data: navigateInternalPayloadSchema,
  }),
  z.object({
    type: z.literal(PortalEventTypes.APP_NAVIGATE_PARENT),
    data: navigateParentPayloadSchema,
  }),
  z.object({
    type: z.literal(PortalEventTypes.APP_SHOW_MODAL),
    data: showModalPayloadSchema,
  }),
  z.object({
    type: z.literal(PortalEventTypes.APP_CLOSE_MODAL),
    data: closeModalPayloadSchema,
  }),
]);

/**
 * Schema for portal messages
 * @description Extends portal events with metadata for message passing
 */
const portalMessageSchema = portalEventSchema.and(
  z.object({
    /** Target identifier for the message (app ID or "portal") */
    targetId: z.string().optional(),
    /** Source identifier for the message (app ID or "portal") */
    sourceId: z.string(),
    /** Timestamp when the message was created */
    timestamp: z.number(),
  })
);

/**
 * Validation schemas for portal communication
 * @description Collection of Zod schemas for runtime validation
 */
export const event_schemas = {
  /** Schema for modal content */
  portalModalContent: portalModalContentSchema,
  /** Schema for modal display options */
  portalModalDisplayOptions: portalModalDisplayOptionsSchema,
  /** Schema for APP_READY event payload */
  appReadyPayload: appReadyPayloadSchema,
  /** Schema for APP_ERROR event payload */
  appErrorPayload: appErrorPayloadSchema,
  /** Schema for PORTAL_INIT_APP event payload */
  portalAppInitPayload: portalAppInitPayloadSchema,
  /** Schema for navigation error payloads */
  portalNavigationError: portalNavigationErrorSchema,
  /** Schema for APP_NAVIGATE_INTERNAL event payload */
  navigateInternalPayload: navigateInternalPayloadSchema,
  /** Schema for APP_NAVIGATE_PARENT event payload */
  navigateParentPayload: navigateParentPayloadSchema,
  /** Schema for APP_SHOW_MODAL event payload */
  showModalPayload: showModalPayloadSchema,
  /** Schema for APP_CLOSE_MODAL event payload */
  closeModalPayload: closeModalPayloadSchema,
  /** Schema for portal events */
  portalEvent: portalEventSchema,
  /** Schema for portal messages */
  portalMessage: portalMessageSchema,
};

/** Type representing all possible event types */
export type PortalEventType = keyof typeof PortalEventTypes;

/** APP_READY event payload type */
export type AppReadyPayload = z.infer<typeof appReadyPayloadSchema>;

/** APP_ERROR event payload type */
export type AppErrorPayload = z.infer<typeof appErrorPayloadSchema>;

/** PORTAL_INIT_APP event payload type */
export type PortalAppInitPayload = z.infer<typeof portalAppInitPayloadSchema>;

/** Navigation error payload type */
export type PortalNavigationError = z.infer<typeof portalNavigationErrorSchema>;

/** APP_NAVIGATE_INTERNAL event payload type */
export type NavigateInternalPayload = z.infer<
  typeof navigateInternalPayloadSchema
>;

/** APP_NAVIGATE_PARENT event payload type */
export type NavigateParentPayload = z.infer<typeof navigateParentPayloadSchema>;

/** APP_SHOW_MODAL event payload type */
export type ShowModalPayload = z.infer<typeof showModalPayloadSchema>;

/** APP_CLOSE_MODAL event payload type */
export type CloseModalPayload = z.infer<typeof closeModalPayloadSchema>;

/** Portal event type */
export type PortalEvent = z.infer<typeof portalEventSchema>;

/** Portal message type */
export type PortalMessage = z.infer<typeof portalMessageSchema>;

/** Identifier for the portal target */
export const PORTAL_TARGET_ID = "portal";
