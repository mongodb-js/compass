import type { ChainablePromiseElement } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

export async function getInputByLabel(
  browser: CompassBrowser,
  label: ChainablePromiseElement | string
): Promise<ChainablePromiseElement> {
  if (typeof label === 'string') {
    label = browser.$(`//label[text()="${label}"]`);
  }
  await label.waitForDisplayed();
  const inputId = await label.getAttribute('for');
  return browser.$(`[id="${inputId}"]`);
}
