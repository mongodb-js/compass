import type { ChainablePromiseElement } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';
import { resolveElement } from '../utils';

export async function clickParent(
  browser: CompassBrowser,
  selector: string | ChainablePromiseElement
): Promise<void> {
  const element = resolveElement(browser, selector).parentElement();
  await element.waitForExist();
  await element.click();
}
