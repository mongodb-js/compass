import type { ChainablePromiseElement } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

export async function getInputByLabel(
  browser: CompassBrowser,
  label: ChainablePromiseElement
): Promise<ChainablePromiseElement> {
  await label.waitForDisplayed();
  return browser.$(`[id="${await label.getAttribute('for')}"]`);
}
