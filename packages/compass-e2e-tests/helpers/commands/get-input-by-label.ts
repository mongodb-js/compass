import type { ChainablePromiseElement } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

export async function getInputByLabel(
  browser: CompassBrowser,
  label: ChainablePromiseElement
): Promise<ChainablePromiseElement> {
  await label.waitForDisplayed();
  const inputId = await label.getAttribute('for');
  return browser.$(`[id="${inputId}"]`);
}
