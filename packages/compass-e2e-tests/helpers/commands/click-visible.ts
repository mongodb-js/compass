import type { Browser } from 'webdriverio';
import * as Commands from '../commands';

export async function clickVisible(
  browser: Browser<'async'>,
  selector: string
): Promise<void> {
  const element = await browser.$(selector);
  await element.waitForDisplayed();
  await Commands.waitForAnimations(browser, selector);
  await element.click();
}
