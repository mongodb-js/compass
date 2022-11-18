import type { CompassBrowser } from '../compass-browser';
import type { UserPreferences } from 'compass-preferences-model';

export async function getFeature<K extends keyof UserPreferences>(
  browser: CompassBrowser,
  name: K
): Promise<UserPreferences[K]> {
  return await browser.execute(async (_name) => {
    return (
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      (await require('electron').ipcRenderer.invoke('compass:get-preferences'))[
        _name
      ]
    );
  }, name);
}
