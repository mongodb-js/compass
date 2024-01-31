import { Key } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

export async function setValueVisible(
  browser: CompassBrowser,
  selector: string,
  value: string
): Promise<void> {
  // The hardest thing in computer science? Reliably setting a text form field's
  // value in an E2E test.
  await browser.waitUntil(async () => {
    await browser.$(selector).waitForDisplayed();
    await browser.$(selector).click(); // focus
    await browser.keys([Key.Ctrl, 'a']);
    await browser.keys('Delete');

    // If this fails with "invalid element state", then it probably means that
    // the selector is not targeting the input element itself but a container.
    // That used to work somehow.
    await browser.$(selector).setValue(value); // basically clearValue() then addValue()

    const actualValue = (await browser.$(selector).getValue()) ?? '';
    if (actualValue !== value) {
      console.log(actualValue, '!==', value);
      await browser.screenshot('setValueVisible.png');
    }
    return actualValue === value;
  });
}
