import type { ChainablePromiseElement } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser.ts';
import { resolveElement } from '../utils.ts';

export async function waitForAriaDisabled(
  browser: CompassBrowser,
  selector: string | ChainablePromiseElement,
  isDisabled: boolean
): Promise<void> {
  const expectedValue = isDisabled ? 'true' : 'false';

  await browser.waitUntil(
    async () => {
      const element = resolveElement(browser, selector);
      return (await element.getAttribute('aria-disabled')) === expectedValue;
    },
    {
      timeoutMsg: `Expected element to have attribute "aria-disabled" equal to "${expectedValue}"`,
    }
  );
}
