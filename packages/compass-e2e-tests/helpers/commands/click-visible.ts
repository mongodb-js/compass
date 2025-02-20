import type { CompassBrowser } from '../compass-browser';
import type { ChainablePromiseElement } from 'webdriverio';

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

  function getElement() {
    return typeof selector === 'string' ? browser.$(selector) : selector;
  }

  const displayElement = getElement();

  await displayElement.waitForDisplayed(waitOptions);

  // Clicking a thing that's still animating is unreliable at best.
  await browser.waitForAnimations(selector, waitOptions);

  if (options?.scroll) {
    const scrollElement = getElement();
    await scrollElement.scrollIntoView();
    await browser.pause(1000);
  }

  if (options?.screenshot) {
    await browser.screenshot(options.screenshot);
  }
  const clickElement = getElement();
  await clickElement.click();
}
