import _ from 'lodash';
import type { CompassBrowser } from '../compass-browser';

export async function waitForAnimations(
  browser: CompassBrowser,
  selector: string
): Promise<void> {
  const element = await browser.$(selector);

  let previousResult = {
    ...(await element.getLocation()),
    ...(await element.getSize()),
  };
  // small delay to make sure that if it is busy animating it had time to move
  // before the first check
  await browser.pause(50);
  await browser.waitUntil(async function () {
    const result = {
      ...(await element.getLocation()),
      ...(await element.getSize()),
    };
    const stopped = _.isEqual(result, previousResult);
    previousResult = result;
    return stopped;
  });
}
