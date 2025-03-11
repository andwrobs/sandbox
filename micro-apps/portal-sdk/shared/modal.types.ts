import { z } from "zod";

/**
 * Schema for modal content
 * @description Defines the structure of content displayed in a modal
 */
export const portalModalContentSchema = z.object({
  /** Modal title */
  title: z.string(),
  /** Modal body content */
  body: z.string(),
});

/**
 * Schema for modal display options
 * @description Defines optional configuration for how modals are displayed
 */
export const portalModalDisplayOptionsSchema = z
  .object({
    /** Size variant of the modal */
    size: z.enum(["small", "medium", "large"]).optional(),
    /** Whether clicking outside the modal should close it */
    closeOnClickOutside: z.boolean().optional(),
    /** Whether to show the close button */
    showCloseButton: z.boolean().optional(),
  })
  .optional();

/**
 * Schema for portal modal configuration
 * @description Defines the structure of a modal in the portal system
 */
export const portalModalSchema = z.object({
  /** ID of the app that created the modal */
  appId: z.string(),
  /** What to show in the modal */
  content: portalModalContentSchema,
  /** Modal display options */
  displayOptions: portalModalDisplayOptionsSchema,
});

/**
 * Validation schemas for modal types
 * @description Collection of Zod schemas for runtime validation
 */
export const modal_schemas = {
  /** Schema for modal content */
  portalModalContent: portalModalContentSchema,
  /** Schema for modal display options */
  portalModalDisplayOptions: portalModalDisplayOptionsSchema,
  /** Schema for portal modal configuration */
  portalModal: portalModalSchema,
};

/** Modal content type */
export type PortalModalContent = z.infer<typeof portalModalContentSchema>;

/** Modal display options type */
export type PortalModalDisplayOptions = z.infer<
  typeof portalModalDisplayOptionsSchema
>;

/** Portal modal configuration type */
export type PortalModal = z.infer<typeof portalModalSchema>;
