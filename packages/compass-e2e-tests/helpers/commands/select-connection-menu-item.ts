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

  // workaround for weirdness in the ItemActionControls menu opener icon
  await browser.clickVisible(Selectors.SidebarNewConnectionButton);

  await browser.hover(selector);

  await browser.clickVisible(Selectors.sidebarFavoriteMenuButton(favoriteName));
  await browser.$(Selectors.ConnectionMenu).waitForDisplayed();
  await browser.clickVisible(itemSelector);
}
