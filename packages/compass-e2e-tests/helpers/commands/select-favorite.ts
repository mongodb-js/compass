import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function selectFavorite(
  browser: CompassBrowser,
  favoriteName: string
): Promise<void> {
  await browser.clickVisible(Selectors.sidebarFavoriteButton(favoriteName));
  await browser.waitUntil(async () => {
    const text = await browser.$(Selectors.ConnectionTitle).getText();
    return text === favoriteName;
  });
}
