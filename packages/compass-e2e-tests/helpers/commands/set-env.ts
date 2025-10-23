import type { CompassBrowser } from '../compass-browser';
import { isTestingWeb } from '../test-runner-context';

/**
 * Sets an environment variable override in Compass. This works the same way both for Compass desktop and web runtimes
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
): Promise<Record<string, string>> {
  // In web, use injected function to set the env
  if (isTestingWeb()) {
    await browser.waitUntil(async () => {
      return await browser.execute(() => {
        return Symbol.for('@compass-web-sandbox-set-env') in globalThis;
      });
    });
    return await browser.execute(
      (_key, _value) => {
        const kSandboxSetEnvFn = Symbol.for('@compass-web-sandbox-set-env');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (globalThis as any)[kSandboxSetEnvFn](_key, _value) as Record<
          string,
          string
        >;
      },
      key,
      value
    );
  } else {
    // In electron, just set the existing global var
    return await browser.execute(
      (_key, _value) => {
        process.env[_key] = _value;
        return process.env as Record<string, string>;
      },
      key,
      value
    );
  }
}
