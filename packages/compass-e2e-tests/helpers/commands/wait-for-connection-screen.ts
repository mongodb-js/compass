import { Browser } from 'webdriverio';
import * as Selectors from '../selectors';

export async function waitForConnectionScreen(
  browser: Browser<'async'>
): Promise<void> {
  const connectScreenElement = await browser.$(Selectors.ConnectSection);
  await connectScreenElement.waitForDisplayed({ timeout: 60_000 });
}
