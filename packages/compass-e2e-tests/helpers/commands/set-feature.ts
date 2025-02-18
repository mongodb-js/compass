import type { CompassBrowser } from '../compass-browser';
import type {
  AllPreferences,
  UserPreferences,
} from 'compass-preferences-model';
import { isTestingWeb } from '../test-runner-context';

export async function setFeature<K extends keyof UserPreferences>(
  browser: CompassBrowser,
  name: K,
  value: UserPreferences[K]
): Promise<void> {
  if (isTestingWeb()) {
    await browser.waitUntil(async function () {
      // When running in Compass web we cannot use the IPC to update the
      // preferences so we use a global function.
      const didSavePreference = await browser.execute(
        async (_name, _value) => {
          if (!(globalThis as any).__compassWebE2ETestSavePreferences) {
            return false;
          }

          const attributes: Partial<AllPreferences> = {
            [_name]: _value === null ? undefined : _value,
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (globalThis as any).__compassWebE2ETestSavePreferences(
            attributes
          );

          return true;
        },
        name,
        value
      );

      return didSavePreference;
    });
    return;
  }

  await browser.execute(
    async (_name, _value) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      await require('electron').ipcRenderer.invoke('compass:save-preferences', {
        [_name]: _value === null ? undefined : _value,
      });
    },
    name,
    value
  );
}
