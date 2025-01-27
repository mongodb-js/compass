import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function selectConnectionsMenuItem(
  browser: CompassBrowser,
  itemSelector: string
) {
  await browser.clickVisible(Selectors.ConnectionsMenuButton);
  await browser.$(Selectors.ConnectionsMenu).waitForDisplayed();
  await browser.clickVisible(itemSelector);
}
