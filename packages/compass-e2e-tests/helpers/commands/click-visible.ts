import type { CompassBrowser } from '../compass-browser';

export async function clickVisible(
  browser: CompassBrowser,
  selector: string
): Promise<void> {
  const displayElement = await browser.$(selector);

  await displayElement.waitForDisplayed();

  // Clicking a thing that's still animating is unreliable at best.
  await browser.waitForAnimations(selector);

  const clickElement = await browser.$(selector);
  await clickElement.click();
}
