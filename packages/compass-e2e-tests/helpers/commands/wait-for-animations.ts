import _ from 'lodash';
import type { CompassBrowser } from '../compass-browser';

export async function waitForAnimations(
  browser: CompassBrowser,
  selector: string
): Promise<void> {
  const initialElement = await browser.$(selector);

  let previousResult = {
    ...(await initialElement.getLocation()),
    ...(await initialElement.getSize()),
  };
  await browser.waitUntil(async function () {
    // small delay to make sure that if it is busy animating it had time to move
    // before the first check and between each two checks
    await browser.pause(50);

    const currentElement = await browser.$(selector);

    const result = {
      ...(await currentElement.getLocation()),
      ...(await currentElement.getSize()),
    };
    const stopped = _.isEqual(result, previousResult);
    previousResult = result;
    return stopped;
  });
}
