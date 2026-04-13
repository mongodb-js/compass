import type { ChainablePromiseElement } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser.ts';
import { resolveElement } from '../utils.ts';

export async function clickParent(
  browser: CompassBrowser,
  selector: string | ChainablePromiseElement
): Promise<void> {
  const element = resolveElement(browser, selector).parentElement();
  await element.waitForExist();
  await element.click();
}
