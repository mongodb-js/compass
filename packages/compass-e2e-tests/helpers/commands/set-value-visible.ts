import { Key } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';
import type { ChainablePromiseElement } from 'webdriverio';

export async function setValueVisible(
  browser: CompassBrowser,
  selector:
    | string
    | ChainablePromiseElement<WebdriverIO.Element>
    | WebdriverIO.Element,
  value: string
): Promise<void> {
  // The hardest thing in computer science? Reliably setting a text form field's
  // value in an E2E test.
  async function getElement() {
    return typeof selector === 'string' ? await browser.$(selector) : selector;
  }
  const element = await getElement();

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
    if (actualValue !== value) {
      console.log(actualValue, '!==', value);
      await browser.screenshot('setValueVisible.png');
    }
    return actualValue === value;
  });
}
