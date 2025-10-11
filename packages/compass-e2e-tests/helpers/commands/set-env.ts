import type { CompassBrowser } from '../compass-browser';
import { isTestingWeb } from '../test-runner-context';

/**
 * Sets an environment variable override in Compass Web.
 * This is only supported in Compass Web tests, not in Compass Desktop.
 *
 * @example
 * // Set the Atlas service URL override in a test
 * await browser.setEnv(
 *   'COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE',
 *   mockAtlasServer.endpoint
 * );
 *
 * @param browser - The CompassBrowser instance
 * @param key - The environment variable name
 * @param value - The environment variable value
 */
export async function setEnv(
  browser: CompassBrowser,
  key: string,
  value: string
): Promise<void> {
  if (isTestingWeb()) {
    // When running in Compass web we use a global function to set env vars
    await browser.execute(
      (_key, _value) => {
        const kSandboxSetEnvFn = Symbol.for('@compass-web-sandbox-set-env');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any)[kSandboxSetEnvFn]?.(_key, _value);
      },
      key,
      value
    );
    return;
  }

  // When running in Compass desktop, we can't dynamically change env vars
  // after the process has started, so we throw an error
  throw new Error(
    'setEnv is only supported in Compass web. For Compass desktop, set environment variables before starting the app.'
  );
}
