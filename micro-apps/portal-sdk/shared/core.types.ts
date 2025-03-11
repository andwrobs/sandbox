import { z } from "zod";

/**
 * Schema for user data
 * @description Defines the structure of user information
 */
export const userSchema = z.object({
  /** User's first name */
  firstName: z.string(),
  /** User's last name */
  lastName: z.string(),
  /** User's email address */
  email: z.string(),
  /** Optional ISO country code */
  countryCode: z.string().optional(),
  /** Optional telephone number */
  telephoneNumber: z.string().optional(),
  /** Optional user reference ID */
  userReference: z.string().optional(),
});

/**
 * Schema for user session data
 * @description Defines user information and authentication token
 */
export const userSessionSchema = z.object({
  /** User information */
  user: userSchema,
  /** Authentication token */
  token: z.string(),
});

/**
 * Schema for micro-app configuration
 * @description Defines the structure of a micro-app configuration
 */
export const microAppSchema = z.object({
  /** Unique identifier for the micro-app */
  id: z.string(),
  /** Display name of the micro-app */
  name: z.string(),
  /** Micro-App's version number (X.X.X) */
  version: z.string(),
  /** Base URL where the micro-app is hosted */
  baseUrl: z.string(),
  /** Entry point path relative to baseUrl */
  entryPoint: z.string(),
  /** Routes the micro-app is permitted to navigate to within its own iframe */
  permittedInternalRoutes: z.array(z.string()),
  /** Routes the micro-app is permitted to request the parent application to navigate to */
  permittedParentRoutes: z.array(z.string()),
  /** Initial data to be passed to the micro-app */
  portalContext: z
    .object({
      userSession: userSessionSchema,
    })
    .optional(),
});

/**
 * Validation schemas for core types
 * @description Collection of Zod schemas for runtime validation
 */
export const schemas = {
  /** Schema for user data */
  user: userSchema,
  /** Schema for user session data */
  userSession: userSessionSchema,
  /** Schema for micro-app configuration */
  microApp: microAppSchema,
};

/** User information type */
export type User = z.infer<typeof userSchema>;

/** User session data type */
export type UserSession = z.infer<typeof userSessionSchema>;

/** Micro-App configuration type */
export type MicroApp = z.infer<typeof microAppSchema>;
