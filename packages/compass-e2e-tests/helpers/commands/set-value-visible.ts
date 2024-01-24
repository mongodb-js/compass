import { Key } from 'webdriverio';
import type { CompassBrowser } from '../compass-browser';

export async function setValueVisible(
  browser: CompassBrowser,
  selector: string,
  value: string
): Promise<void> {
  await browser.waitUntil(async () => {
    const element = await browser.$(selector);
    await element.waitForDisplayed();
    await element.click(); // focus
    await element.clearValue();
    await browser.keys([Key.Ctrl, 'a']);
    await browser.keys('Delete');
    await element.setValue(value);
    const actualValue = await element.getValue();
    if (actualValue !== value) {
      console.log(actualValue, '!==', value);
    }
    return actualValue === value;
  });
}
