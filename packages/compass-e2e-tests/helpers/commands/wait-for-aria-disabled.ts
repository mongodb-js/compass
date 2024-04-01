import type { ChainablePromiseElement } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

export async function waitForAriaDisabled(
  browser: CompassBrowser,
  selector:
    | string
    | ChainablePromiseElement<WebdriverIO.Element>
    | WebdriverIO.Element,
  isDisabled: boolean
): Promise<void> {
  async function getElement() {
    return typeof selector === 'string' ? await browser.$(selector) : selector;
  }
  const element = await getElement();
  const expectedValue = isDisabled ? 'true' : 'false';

  await browser.waitUntil(
    async () => {
      return (await element.getAttribute('aria-disabled')) === expectedValue;
    },
    {
      timeoutMsg: `Expected ${selector} to have attribute "aria-disabled" equal to "${expectedValue}"`,
    }
  );
}
