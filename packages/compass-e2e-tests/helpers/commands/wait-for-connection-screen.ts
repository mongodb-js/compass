import { TEST_COMPASS_WEB } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function waitForConnectionScreen(
  browser: CompassBrowser
): Promise<void> {
  // TODO: can we not just make this the same selector in both cases somehow?
  const selector = TEST_COMPASS_WEB
    ? 'textarea[title="Connection string"]'
    : Selectors.ConnectSection;
  const connectScreenElement = await browser.$(selector);
  await connectScreenElement.waitForDisplayed();
}
