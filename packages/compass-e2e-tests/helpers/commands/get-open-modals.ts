import type { ChainablePromiseArray } from 'webdriverio';

import { Selectors } from '../compass.ts';
import type { CompassBrowser } from '../compass-browser.ts';

export function getOpenModals(
  browser: CompassBrowser,
  selector: string = Selectors.LGModal
): ChainablePromiseArray {
  return browser.custom$$('dialogOpen', selector);
}
