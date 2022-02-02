import type { CompassBrowser } from '../compass-browser';

export async function clickVisible(
  browser: CompassBrowser,
  selector: string,
): Promise<void> {
  const element = await browser.$(selector);

  await element.waitForDisplayed();

  // Clicking a thing that's still animating is unreliable at best.
  await browser.waitForAnimations(selector);

  await element.click();
}
