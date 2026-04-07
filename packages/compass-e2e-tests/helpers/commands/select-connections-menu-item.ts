import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

export async function selectConnectionsMenuItem(
  browser: CompassBrowser,
  itemSelector: string
) {
  await browser.clickVisible(Selectors.ConnectionsMenuButton);
  await browser.$(Selectors.ConnectionsMenu).waitForDisplayed();
  await browser.clickVisible(itemSelector);
}
