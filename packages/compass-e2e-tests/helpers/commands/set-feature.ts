import type { CompassBrowser } from '../compass-browser';
import type { UserPreferences } from 'compass-preferences-model';

export async function setFeature<K extends keyof UserPreferences>(
  browser: CompassBrowser,
  name: K,
  value: UserPreferences[K]
): Promise<void> {
  // Using executeAsync because even though browser.execute does seem to resolve
  // promises it looks like the script timeout only applies to executeAsync. So
  // this can hang indefinitely until the mocha test or hook timeout is hit.
  await browser.executeAsync(
    (_name, _value, done) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('electron')
        .ipcRenderer.invoke('compass:save-preferences', {
          [_name]: _value === null ? undefined : _value,
        })
        .then((result: any) => {
          done(result);
        })
        .catch((err: any) => {
          // unfortunately done() only takes one parameter with no way to
          // differentiate between success and error
          done(err);
        });
    },
    name,
    value
  );
}
