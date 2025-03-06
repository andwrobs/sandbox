import type { MicroApp } from "./portal.types";

/**
 * Security utilities for the portal system
 */
export class PortalSecurity {
  /**
   * Validates if a given route path is permitted for internal navigation within the micro-app
   * @param app The micro-app configuration
   * @param routePath The route path to validate
   * @returns True if the route is permitted for internal navigation, false otherwise
   */
  static validateInternalRoutePermission(
    app: MicroApp,
    routePath: string
  ): boolean {
    try {
      return this.matchRoutePattern(routePath, app.permittedInternalRoutes);
    } catch (error) {
      console.error(
        `Invalid internal route validation for app ${app.id}:`,
        error
      );
      return false;
    }
  }

  /**
   * Validates if a given route path is permitted for parent application navigation
   * @param app The micro-app configuration
   * @param routePath The route path to validate
   * @returns True if the route is permitted for parent navigation, false otherwise
   */
  static validateParentRoutePermission(
    app: MicroApp,
    routePath: string
  ): boolean {
    try {
      return this.matchRoutePattern(routePath, app.permittedParentRoutes);
    } catch (error) {
      console.error(
        `Invalid parent route validation for app ${app.id}:`,
        error
      );
      return false;
    }
  }

  /**
   * Checks if a route path matches any of the provided patterns
   * @param routePath The route path to check
   * @param patterns Array of route patterns to match against
   * @returns True if the route matches any pattern, false otherwise
   */
  private static matchRoutePattern(
    routePath: string,
    patterns: string[]
  ): boolean {
    return patterns.some((pattern) => {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\*/g, ".*") // Convert * to .*
        .replace(/\?/g, "."); // Convert ? to .

      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(routePath);
    });
  }

  /**
   * Constructs the full entry point URL for a micro-app
   * @param app The micro-app configuration
   * @returns The complete entry point URL
   */
  static getEntryPointUrl(app: MicroApp): string {
    // Ensure baseUrl doesn't end with a slash and entryPoint starts with a slash
    const baseUrl = app.baseUrl.endsWith("/")
      ? app.baseUrl.slice(0, -1)
      : app.baseUrl;
    const entryPoint = app.entryPoint.startsWith("/")
      ? app.entryPoint
      : `/${app.entryPoint}`;

    return `${baseUrl}${entryPoint}`;
  }

  /**
   * Validates the origin of a message event against the micro-app's base URL
   * @param messageEvent The message event to validate
   * @param app The micro-app configuration
   * @returns True if the origin is valid, false otherwise
   */
  static validateMessageOrigin(
    messageEvent: MessageEvent,
    app: MicroApp
  ): boolean {
    try {
      const eventOrigin = new URL(messageEvent.origin);
      const appOrigin = new URL(app.baseUrl);

      return eventOrigin.origin === appOrigin.origin;
    } catch (error) {
      console.error(`Invalid origin validation for app ${app.id}:`, error);
      return false;
    }
  }
}
