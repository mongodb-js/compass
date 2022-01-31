import type { CompassBrowser } from '../compass-browser';

export async function setValueVisible(
  browser: CompassBrowser,
  selector: string,
  value: string
): Promise<void> {
  const element = await browser.$(selector);
  await element.waitForDisplayed();
  await element.setValue(value);
}
