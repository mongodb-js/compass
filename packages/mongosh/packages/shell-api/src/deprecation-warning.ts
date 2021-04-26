const warningShown: Set<string> = new Set();

/**
 * Prints deprecation warning message once
 *
 * @param message Deprecation message
 * @param warn Printing method (default: `console.warn`)
 */
export function printDeprecationWarning(
  message: string,
  warn = console.warn
) {
  if (!warningShown.has(message)) {
    warningShown.add(message);
    warn(`DeprecationWarning: ${message}`);
  }
}

export function printWarning(
  message: string,
  warn = console.warn
) {
  if (!warningShown.has(message)) {
    warningShown.add(message);
    warn(`Warning: ${message}`);
  }
}
