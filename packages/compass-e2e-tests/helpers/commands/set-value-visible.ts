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
    await element.clearValue();
    await element.click(); // focus
    await browser.keys([Key.Ctrl, 'a']);
    await browser.keys('Delete');
    await browser.screenshot('setValueVisible_clear.png');
    await element.setValue(value);
    const actualValue = await element.getValue();
    if (actualValue !== value) {
      console.log(actualValue, '!==', value);
    }
    return actualValue === value;
  });
}
