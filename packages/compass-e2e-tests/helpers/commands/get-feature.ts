import type { CompassBrowser } from '../compass-browser';
import type { UserPreferences } from 'compass-preferences-model';
import { isTestingWeb } from '../test-runner-context';

export async function getFeature<K extends keyof UserPreferences>(
  browser: CompassBrowser,
  name: K
): Promise<UserPreferences[K]> {
  return (await getFeatures(browser))[name];
}

export async function getFeatures(
  browser: CompassBrowser
): Promise<UserPreferences> {
  if (isTestingWeb()) {
    // When running in Compass web we cannot use the IPC to read the
    // preferences so we use a global function
    await browser.waitUntil(async () => {
      return await browser.execute(() => {
        return (
          Symbol.for('@compass-web-sandbox-preferences-access') in globalThis
        );
      });
    });
    return await browser.execute(() => {
      return (globalThis as any)[
        Symbol.for('@compass-web-sandbox-preferences-access')
      ].getPreferences();
    });
  }
  return await browser.execute(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return await require('electron').ipcRenderer.invoke(
      'compass:get-preferences'
    );
  });
}
