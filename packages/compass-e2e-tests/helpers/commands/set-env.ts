import type { CompassBrowser } from '../compass-browser';
import { inspect } from 'util';

/**
 * Sets an environment variable override in Compass, both web and desktop.
 * Requires an application to be running already to be used, so make sure that
 * the env variables you are changing are accessed dynamically in the
 * application runtime after initialization
 *
 * @example
 * // Set the Atlas service URL override in a test
 * await browser.setEnv(
 *   'COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE',
 *   mockAtlasServer.endpoint
 * );
 *
 * @param browser The CompassBrowser instance
 * @param key The environment variable name
 * @param value The environment variable value
 */
export async function setEnv(
  browser: CompassBrowser,
  key: string,
  value: string
): Promise<void> {
  let latestValue: string | undefined;
  try {
    await browser.waitUntil(async () => {
      try {
        latestValue = await browser.execute(
          async (_key, _value) => {
            // If process is available in global scope, we're in desktop
            if ('process' in globalThis) {
              process.env[_key] = _value;
              // eslint-disable-next-line @typescript-eslint/no-require-imports
              return await require('electron').ipcRenderer.invoke(
                'compass:set-process-env',
                _key,
                _value
              );
            } else {
              const kProcessEnv = Symbol.for(
                '@compass-web-sandbox-process-env'
              );
              (globalThis as any)[kProcessEnv][_key] = _value;
              return (globalThis as any)[kProcessEnv][_key];
            }
          },
          key,
          value
        );
        // null and undefined are the same when sending values through
        // browser.execute
        // eslint-disable-next-line eqeqeq
        return latestValue == value;
      } catch {
        // Either ipcRenderer.invoke or trying to set the value on undefined
        // will fail inside browser.execute, this is a good indicator that the
        // app is not ready yet for setEnv to be called. Return `false` to wait
        // a bit more
        return false;
      }
    });
  } catch (err) {
    throw new Error(
      `Failed to set process.env.${key}: expected new value to be ${inspect(
        value
      )}, got ${inspect(latestValue)}. Original error:\n\n${
        (err as Error).message
      }`
    );
  }
}
