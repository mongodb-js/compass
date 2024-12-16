import type { ChainablePromiseElement } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

export async function waitForAriaDisabled(
  browser: CompassBrowser,
  selector: string | ChainablePromiseElement,
  isDisabled: boolean
): Promise<void> {
  function getElement() {
    return typeof selector === 'string' ? browser.$(selector) : selector;
  }

  const expectedValue = isDisabled ? 'true' : 'false';

  await browser.waitUntil(
    async () => {
      const element = getElement();
      return (await element.getAttribute('aria-disabled')) === expectedValue;
    },
    {
      timeoutMsg: `Expected element to have attribute "aria-disabled" equal to "${expectedValue}"`,
    }
  );
}
