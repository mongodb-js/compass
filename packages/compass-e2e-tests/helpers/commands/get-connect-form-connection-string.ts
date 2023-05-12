import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function getConnectFormConnectionString(
  browser: CompassBrowser,
  isFocused = false
): Promise<string> {
  const inputElem = await browser.$(Selectors.ConnectionStringInput);
  await inputElem.waitForDisplayed();
  if (isFocused) {
    await browser.waitUntil(async () => {
      await inputElem.click();
      return await inputElem.isFocused();
    });
  }
  const connectionString = await inputElem.getValue();
  return connectionString;
}
