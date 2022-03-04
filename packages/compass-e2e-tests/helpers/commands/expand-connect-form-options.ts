import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function expandConnectFormOptions(
  browser: CompassBrowser
): Promise<boolean> {
  const advancedButton = await browser.$(Selectors.ShowConnectionFormButton);
  await advancedButton.waitForDisplayed();

  if ((await advancedButton.getAttribute('aria-expanded')) === 'false') {
    await advancedButton.click();
    await browser.waitUntil(async () => {
      return (await advancedButton.getAttribute('aria-expanded')) === 'true';
    });
    return false; // it was collapsed and had to expand
  }

  return true; // it was expanded already
}
