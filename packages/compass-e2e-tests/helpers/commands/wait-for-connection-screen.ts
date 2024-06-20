import { TEST_COMPASS_WEB, TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function waitForConnectionScreen(
  browser: CompassBrowser
): Promise<void> {
  // there isn't a separate connection screen in multiple connections, just a modal you can access at any time
  if (TEST_MULTIPLE_CONNECTIONS) {
    return;
  }

  const selector = TEST_COMPASS_WEB
    ? Selectors.ConnectionFormStringInput
    : Selectors.ConnectSection;
  const connectScreenElement = await browser.$(selector);
  await connectScreenElement.waitForDisplayed();
}
