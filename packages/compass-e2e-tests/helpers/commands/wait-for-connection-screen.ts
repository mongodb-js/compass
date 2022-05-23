import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function waitForConnectionScreen(
  browser: CompassBrowser
): Promise<void> {
  const connectScreenElement = await browser.$(Selectors.ConnectSection);
  await connectScreenElement.waitForDisplayed();
}
