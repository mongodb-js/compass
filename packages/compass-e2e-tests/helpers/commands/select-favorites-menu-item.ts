import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function selectFavoritesMenuItem(
  browser: CompassBrowser,
  itemSelector: string
) {
  const selector = Selectors.FavoriteConnectionsHeader;
  await browser.$(selector).waitForDisplayed();

  // workaround for weirdness in the ItemActionControls menu opener icon
  await browser.clickVisible(Selectors.ConnectionsTitle);

  // Hover over an arbitrary other element to ensure that the second hover will
  // actually be a fresh one. This otherwise breaks if this function is called
  // twice in a row.
  await browser.hover(`*:not(${selector}, ${selector} *)`);
  await browser.hover(selector);

  await browser.clickVisible(Selectors.FavoriteConnectionsMenuButton);
  await browser.$(Selectors.FavoriteConnectionsMenu).waitForDisplayed();
  await browser.clickVisible(itemSelector);
}
