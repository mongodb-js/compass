import type { Browser } from 'webdriverio';

export async function setValueVisible(
  browser: Browser<'async'>,
  selector: string,
  value: string
): Promise<void> {
  const element = await browser.$(selector);
  await element.waitForDisplayed();
  await element.setValue(value);
}
