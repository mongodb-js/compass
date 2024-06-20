import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

// TODO(COMPASS-8007): This should operate on an all-connections-wide menu for
// multiple connections. ie. it is for actions like import/export connections
export async function selectFavoritesMenuItem(
  browser: CompassBrowser,
  itemSelector: string
) {
  const selector = Selectors.Single.FavoriteConnectionsHeader;
  await browser.$(selector).waitForDisplayed();

  // workaround for weirdness in the ItemActionControls menu opener icon
  await browser.clickVisible(Selectors.Single.ConnectionsTitle);

  // Hover over an arbitrary other element to ensure that the second hover will
  // actually be a fresh one. This otherwise breaks if this function is called
  // twice in a row.
  await browser.hover(`*:not(${selector}, ${selector} *)`);
  await browser.hover(selector);

  await browser.clickVisible(Selectors.Single.FavoriteConnectionsMenuButton);
  await browser.$(Selectors.Single.FavoriteConnectionsMenu).waitForDisplayed();
  await browser.clickVisible(itemSelector);
}
