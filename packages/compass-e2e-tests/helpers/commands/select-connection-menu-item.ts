import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function selectConnectionMenuItem(
  browser: CompassBrowser,
  favoriteName: string,
  itemSelector: string
) {
  const selector = Selectors.sidebarFavorite(favoriteName);
  // It takes some time for the favourites to load
  await browser.$(selector).waitForDisplayed();
  await browser.hover(selector);

  await browser.clickVisible(Selectors.sidebarFavoriteMenuButton(favoriteName));
  await browser.$(Selectors.ConnectionMenu).waitForDisplayed();
  await browser.clickVisible(itemSelector);
}
