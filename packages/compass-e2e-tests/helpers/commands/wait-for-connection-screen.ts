import { TEST_COMPASS_WEB } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function waitForConnectionScreen(
  browser: CompassBrowser
): Promise<void> {
  const selector = TEST_COMPASS_WEB
    ? Selectors.ConnectionStringInput
    : Selectors.ConnectSection;
  const connectScreenElement = await browser.$(selector);
  await connectScreenElement.waitForDisplayed();
}
