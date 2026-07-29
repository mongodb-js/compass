import type { ChainablePromiseElement } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser.ts';
import { resolveElement } from '../utils.ts';

export async function hover(
  browser: CompassBrowser,
  selector: string | ChainablePromiseElement
): Promise<void> {
  await resolveElement(browser, selector).moveTo();
}
