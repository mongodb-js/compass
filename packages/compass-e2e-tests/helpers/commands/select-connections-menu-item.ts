import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function selectConnectionsMenuItem(
  browser: CompassBrowser,
  itemSelector: string
) {
  const Sidebar = Selectors.Multiple;
  await browser.clickVisible(Sidebar.ConnectionsMenuButton);
  await browser.$(Sidebar.ConnectionsMenu).waitForDisplayed();
  await browser.clickVisible(itemSelector);
}
