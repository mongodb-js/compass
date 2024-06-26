import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function selectConnectionsMenuItem(
  browser: CompassBrowser,
  itemSelector: string
) {
  const Sidebar = TEST_MULTIPLE_CONNECTIONS
    ? Selectors.Multiple
    : Selectors.Single;

  if (!TEST_MULTIPLE_CONNECTIONS) {
    // In the single connection world the button only appears on hover

    const selector = Selectors.Single.FavoriteConnectionsHeader;
    await browser.$(selector).waitForDisplayed();

    // workaround for weirdness in the ItemActionControls menu opener icon
    await browser.clickVisible(Selectors.Single.ConnectionsTitle);

    // Hover over an arbitrary other element to ensure that the second hover will
    // actually be a fresh one. This otherwise breaks if this function is called
    // twice in a row.
    await browser.hover(`*:not(${selector}, ${selector} *)`);
    await browser.hover(selector);
  }

  await browser.clickVisible(Sidebar.ConnectionsMenuButton);
  await browser.$(Sidebar.ConnectionsMenu).waitForDisplayed();
  await browser.clickVisible(itemSelector);
}
