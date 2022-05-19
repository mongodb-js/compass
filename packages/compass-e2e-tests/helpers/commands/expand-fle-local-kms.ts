import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function expandFLELocalKMS(
  browser: CompassBrowser
): Promise<boolean> {
  const localKMSButton = await browser.$(Selectors.ConnectionFormInputFLELocalKMS);
  await localKMSButton.waitForDisplayed();

  if ((await localKMSButton.getAttribute('aria-expanded')) === 'false') {
    await localKMSButton.click();
    await browser.waitUntil(async () => {
      return (await localKMSButton.getAttribute('aria-expanded')) === 'true';
    });
    return false; // it was collapsed and had to expand
  }

  return true; // it was expanded already
}
