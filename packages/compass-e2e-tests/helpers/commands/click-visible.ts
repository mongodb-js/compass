import type { CompassBrowser } from '../compass-browser';
import type { ChainablePromiseElement } from 'webdriverio';

interface ClickOptions {
  scroll?: boolean;
  screenshot?: string;
}

export async function clickVisible(
  browser: CompassBrowser,
  selector: string | ChainablePromiseElement<WebdriverIO.Element>,
  options?: ClickOptions
): Promise<void> {
  function getElement() {
    return typeof selector === 'string' ? browser.$(selector) : selector;
  }

  const displayElement = getElement();

  await displayElement.waitForDisplayed();

  // Clicking a thing that's still animating is unreliable at best.
  await browser.waitForAnimations(selector);

  if (options?.scroll) {
    const scrollElement = getElement();
    await scrollElement.scrollIntoView();
    await browser.pause(1000);
  }

  if (options?.screenshot) {
    await browser.screenshot(options.screenshot);
  }
  const clickElement = getElement();
  if (await clickElement.isEnabled()) {
    await clickElement.click();
  } else {
    throw new Error(
      `Trying to click ${selector}, but the element is not enabled`
    );
  }
}
