import type { ChainablePromiseElement } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

export async function getInputByLabel(
  browser: CompassBrowser,
  labelSelector: string
): Promise<ChainablePromiseElement> {
  const selectLabel = browser.$(labelSelector);
  await selectLabel.waitForDisplayed();
  return browser.$(`input[id="${await selectLabel.getAttribute('for')}"]`);
}
