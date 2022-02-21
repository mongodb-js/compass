import type { CompassBrowser } from '../compass-browser';

interface ClickOptions {
  scroll?: boolean;
}

export async function clickVisible(
  browser: CompassBrowser,
  selector: string,
  options?: ClickOptions
): Promise<void> {
  const displayElement = await browser.$(selector);
  await displayElement.waitForDisplayed();

  if (options?.scroll) {
    const scrollElement = await browser.$(selector);
    await scrollElement.scrollIntoView();
  }

  // Clicking a thing that's still animating is unreliable at best.
  await browser.waitForAnimations(selector);

  const clickElement = await browser.$(selector);
  await clickElement.click();
}
