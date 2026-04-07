import type { CompassBrowser } from '../compass-browser.ts';
import type { ChainablePromiseElement } from 'webdriverio';
import { resolveElement } from '../utils.ts';

interface ClickOptions {
  timeout?: number;
  scroll?: boolean;
  screenshot?: string;
}

export async function clickVisible(
  browser: CompassBrowser,
  selector: string | ChainablePromiseElement,
  options?: ClickOptions
): Promise<void> {
  const waitOptions = { timeout: options?.timeout };

  const displayElement = resolveElement(browser, selector);

  await displayElement.waitForDisplayed(waitOptions);

  // Clicking a thing that's still animating is unreliable at best.
  await browser.waitForAnimations(selector, waitOptions);

  if (options?.scroll) {
    const scrollElement = resolveElement(browser, selector);
    await scrollElement.scrollIntoView();
    await browser.pause(1000);
  }

  if (options?.screenshot) {
    await browser.screenshot(options.screenshot);
  }
  const clickElement = resolveElement(browser, selector);
  await clickElement.click();
}
