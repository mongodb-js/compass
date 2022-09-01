import type { CompassBrowser } from '../compass-browser';

export async function setFeature(
  browser: CompassBrowser,
  name: string,
  value: boolean | string
): Promise<void> {
  await browser.execute(
    (_name, _value) => {
      const preferences = (global as any)?.hadronApp?.preferences;
      preferences.set(_name, _value);
      preferences.save();
    },
    name,
    value
  );
}
