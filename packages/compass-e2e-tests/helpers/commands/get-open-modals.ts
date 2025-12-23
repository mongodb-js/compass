import type { ChainablePromiseArray } from 'webdriverio';

import { Selectors } from '../compass';
import type { CompassBrowser } from '../compass-browser';

export function getOpenModals(
  browser: CompassBrowser,
  selector: string = Selectors.LGModal
): ChainablePromiseArray {
  return browser.custom$$('dialogOpen', selector);
}
