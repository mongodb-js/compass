import _ from 'lodash';
import type { ChainablePromiseElement, Element } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

export async function waitForAnimations(
  browser: CompassBrowser,
  selector: string | ChainablePromiseElement<Promise<Element<'async'>>>
): Promise<void> {
  function getElement() {
    return typeof selector === 'string' ? browser.$(selector) : selector;
  }

  const initialElement = await getElement();

  let previousResult = {
    ...(await initialElement.getLocation()),
    ...(await initialElement.getSize()),
  };
  await browser.waitUntil(async function () {
    // small delay to make sure that if it is busy animating it had time to move
    // before the first check and between each two checks
    await browser.pause(50);

    const currentElement = await getElement();

    const result = {
      ...(await currentElement.getLocation()),
      ...(await currentElement.getSize()),
    };
    const stopped = _.isEqual(result, previousResult);
    previousResult = result;
    return stopped;
  });
}
