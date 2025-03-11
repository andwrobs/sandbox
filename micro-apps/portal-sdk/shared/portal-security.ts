/**
 * Route validator that supports wildcard (*) and path parameters (:param)
 */

/**
 * Type for route pattern definitions
 */
type RoutePattern = string;

/**
 * Options for route validation
 */
interface RouteValidationOptions {
  /**
   * Whether to ignore trailing slashes when comparing routes
   * @default true
   */
  ignoreTrailingSlash?: boolean;

  /**
   * Whether to match routes case-insensitively
   * @default false
   */
  caseInsensitive?: boolean;
}

/**
 * Convert a route pattern to a regular expression
 * @param pattern The route pattern
 * @returns Regular expression for matching routes
 */
function routePatternToRegex(
  pattern: RoutePattern,
  options: RouteValidationOptions = {}
): RegExp {
  // Normalize the pattern
  let normalizedPattern = pattern;

  // Handle trailing slashes based on options
  if (options.ignoreTrailingSlash !== false) {
    normalizedPattern = normalizedPattern.replace(/\/+$/, "");
  }

  // Escape special regex characters but not our special syntax (* and :param)
  let regexPattern = normalizedPattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape regex special chars
    .replace(/\\\*/g, ".*") // Replace escaped * with .* for wildcard matching
    .replace(/\/:([^\/]+)/g, "/([^/]+)"); // Replace /:param with capture group

  // Handle root path
  if (regexPattern === "") {
    regexPattern = "^\\/?$";
  } else {
    // Add start and end anchors, with optional trailing slash if configured
    regexPattern = `^${regexPattern}${
      options.ignoreTrailingSlash !== false ? "\\/?$" : "$"
    }`;
  }

  // Create and return the regex with case sensitivity option
  return new RegExp(regexPattern, options.caseInsensitive ? "i" : "");
}

/**
 * Check if a route path matches any of the allowed patterns
 * @param routePath The route path to validate
 * @param allowedPatterns List of allowed route patterns
 * @param options Validation options
 * @returns Whether the route path matches any allowed pattern
 */
export function isRouteAllowed(
  routePath: string,
  allowedPatterns: RoutePattern[],
  options: RouteValidationOptions = {}
): boolean {
  // Normalize the routePath
  let normalizedPath = routePath;

  // Handle trailing slashes based on options
  if (options.ignoreTrailingSlash !== false) {
    normalizedPath = normalizedPath.replace(/\/+$/, "");
  }

  // Check if the path matches any of the allowed patterns
  return allowedPatterns.some((pattern) => {
    const regex = routePatternToRegex(pattern, options);
    return regex.test(normalizedPath);
  });
}

/**
 * Extract parameters from a route path based on a pattern
 * @param routePath The route path
 * @param pattern The route pattern with parameters
 * @param options Validation options
 * @returns Object with parameter names and values, or null if no match
 */
export function extractRouteParams(
  routePath: string,
  pattern: RoutePattern,
  options: RouteValidationOptions = {}
): Record<string, string> | null {
  // Normalize the routePath and pattern
  let normalizedPath = routePath;
  let normalizedPattern = pattern;

  // Handle trailing slashes based on options
  if (options.ignoreTrailingSlash !== false) {
    normalizedPath = normalizedPath.replace(/\/+$/, "");
    normalizedPattern = normalizedPattern.replace(/\/+$/, "");
  }

  // Extract parameter names from the pattern
  const paramNames: string[] = [];
  const paramPattern = normalizedPattern.replace(/:[^\/]+/g, (match) => {
    paramNames.push(match.substring(1));
    return "([^/]+)";
  });

  // If there are no parameters in the pattern, return empty object for matching routes
  if (paramNames.length === 0) {
    const simpleRegex = routePatternToRegex(pattern, options);
    return simpleRegex.test(normalizedPath) ? {} : null;
  }

  // Create a regex from the pattern to match and extract values
  const regexPattern = paramPattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape regex special chars
    .replace(/\\\*/g, ".*"); // Replace escaped * with .*

  const regex = new RegExp(
    `^${regexPattern}${options.ignoreTrailingSlash !== false ? "\\/?$" : "$"}`,
    options.caseInsensitive ? "i" : ""
  );

  // Execute the regex against the path
  const match = regex.exec(normalizedPath);

  // If no match, return null
  if (!match) {
    return null;
  }

  // Create result object with parameter names and values
  const params: Record<string, string> = {};

  // Start from index 1 to skip the full match at index 0
  for (let i = 0; i < paramNames.length; i++) {
    params[paramNames[i]] = match[i + 1];
  }

  return params;
}

/**
 * Validate and match a route path against allowed patterns
 * @param routePath The route path to validate
 * @param allowedPatterns List of allowed route patterns
 * @param options Validation options
 * @returns Object with match status and extracted parameters, or null for no match
 */
export function validateRoute(
  routePath: string,
  allowedPatterns: RoutePattern[],
  options: RouteValidationOptions = {}
): { matched: boolean; pattern?: string; params?: Record<string, string> } {
  for (const pattern of allowedPatterns) {
    const params = extractRouteParams(routePath, pattern, options);

    if (params !== null) {
      return {
        matched: true,
        pattern,
        params,
      };
    }
  }

  return { matched: false };
}
