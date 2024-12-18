import _ from 'lodash';
import type { ChainablePromiseElement } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

export async function waitForAnimations(
  browser: CompassBrowser,
  selector: string | ChainablePromiseElement,
  options?: { timeout?: number }
): Promise<void> {
  function getElement() {
    return typeof selector === 'string' ? browser.$(selector) : selector;
  }

  try {
    const initialElement = getElement();

    let previousResult = {
      location: await initialElement.getLocation(),
      size: await initialElement.getSize(),
    };
    await browser.waitUntil(async function () {
      // small delay to make sure that if it is busy animating it had time to move
      // before the first check and between each two checks
      await browser.pause(50);

      const currentElement = getElement();

      const result = {
        location: await currentElement.getLocation(),
        size: await currentElement.getSize(),
      };
      const stopped = _.isEqual(result, previousResult);
      previousResult = result;
      return stopped;
    }, options);
  } catch (err: any) {
    if (err.name !== 'stale element reference') {
      throw err;
    }
  }
}
