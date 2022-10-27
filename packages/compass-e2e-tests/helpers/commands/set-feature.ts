import type { CompassBrowser } from '../compass-browser';

export async function setFeature(
  browser: CompassBrowser,
  name: string,
  value: boolean | string
): Promise<void> {
  await browser.execute(
    async (_name, _value) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      await require('compass-preferences-model').preferencesAccess.savePreferences(
        {
          [_name]: _value,
        }
      );
    },
    name,
    value
  );
}
