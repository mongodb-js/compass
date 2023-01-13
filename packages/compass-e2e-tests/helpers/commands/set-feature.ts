import type { CompassBrowser } from '../compass-browser';
import type { UserPreferences } from 'compass-preferences-model';

export async function setFeature<K extends keyof UserPreferences>(
  browser: CompassBrowser,
  name: K,
  value: UserPreferences[K]
): Promise<void> {
  await browser.execute(
    async (_name, _value) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      await require('electron').ipcRenderer.invoke('compass:save-preferences', {
        [_name]: _value,
      });
    },
    name,
    value
  );
}
