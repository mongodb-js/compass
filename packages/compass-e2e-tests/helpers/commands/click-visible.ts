import type { CompassBrowser } from '../compass-browser';

export async function clickVisible(
  browser: CompassBrowser,
  selector: string
): Promise<void> {
  const element = await browser.$(selector);
  await element.scrollIntoView();
  await element.waitForDisplayed();
  await browser.waitForAnimations(selector);
  await element.click();
}
