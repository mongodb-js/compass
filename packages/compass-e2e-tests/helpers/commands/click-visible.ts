import type { CompassBrowser } from '../compass-browser';
import type { ChainablePromiseElement, Element } from 'webdriverio';

interface ClickOptions {
  scroll?: boolean;
  screenshot?: string;
}

export async function clickVisible(
  browser: CompassBrowser,
  selector: string | ChainablePromiseElement<Promise<Element<'async'>>>,
  options?: ClickOptions
): Promise<void> {
  function getElement() {
    return typeof selector === 'string' ? browser.$(selector) : selector;
  }

  const displayElement = await getElement();

  await displayElement.waitForDisplayed();

  // Clicking a thing that's still animating is unreliable at best.
  await browser.waitForAnimations(selector);

  if (options?.scroll) {
    const scrollElement = await getElement();
    await scrollElement.scrollIntoView();
    await browser.pause(1000);
  }

  const clickElement = await getElement();
  if (options?.screenshot) {
    await browser.saveScreenshot(options.screenshot);
  }
  if (await clickElement.isEnabled()) {
    await clickElement.click();
  } else {
    throw new Error(
      `Trying to click ${selector}, but the element is not enabled`
    );
  }
}
