import { Key } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser.ts';
import type { ChainablePromiseElement } from 'webdriverio';
import { resolveElement } from '../utils.ts';

export async function setValueVisible(
  browser: CompassBrowser,
  selector: string | ChainablePromiseElement,
  value: string
): Promise<void> {
  const element = resolveElement(browser, selector);

  await browser.waitForAnimations(element);

  await browser.waitUntil(async () => {
    await element.waitForDisplayed();
    await element.click(); // focus
    await browser.keys([Key.Ctrl, 'a']);
    await browser.keys('Delete');

    // If this fails with "invalid element state", then it probably means that
    // the selector is not targeting the input element itself but a container.
    // That used to work somehow.
    await element.setValue(value); // basically clearValue() then addValue()

    const actualValue = (await element.getValue()) ?? '';
    return actualValue === value;
  });
}
