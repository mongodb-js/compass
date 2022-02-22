import type { CompassBrowser } from '../compass-browser';

interface ClickOptions {
  scroll?: boolean;
  screenshot?: string;
}

export async function clickVisible(
  browser: CompassBrowser,
  selector: string,
  options?: ClickOptions
): Promise<void> {
  const displayElement = await browser.$(selector);
  await displayElement.waitForDisplayed();

  // Clicking a thing that's still animating is unreliable at best.
  await browser.waitForAnimations(selector);

  if (options?.scroll) {
    const scrollElement = await browser.$(selector);
    await scrollElement.scrollIntoView();
    await browser.pause(1000);
  }

  const clickElement = await browser.$(selector);
  if (options?.screenshot) {
    await browser.saveScreenshot(options.screenshot);
  }
  await clickElement.click();
}
