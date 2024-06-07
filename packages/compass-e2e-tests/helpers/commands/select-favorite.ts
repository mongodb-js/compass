import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function selectFavorite(
  browser: CompassBrowser,
  favoriteName: string
): Promise<void> {
  if (TEST_MULTIPLE_CONNECTIONS) {
    await browser.selectConnectionMenuItem(
      favoriteName,
      Selectors.EditConnectionItem
    );
  } else {
    await browser.pause(1000);

    await browser.clickVisible(Selectors.sidebarFavoriteButton(favoriteName), {
      screenshot: `selecting-favourite-${favoriteName}.png`,
    });
  }

  await browser.waitUntil(async () => {
    const connectionTitleSelector = TEST_MULTIPLE_CONNECTIONS
      ? Selectors.ConnectionModalTitle
      : Selectors.ConnectionTitle;

    const text = await browser.$(connectionTitleSelector).getText();
    return text === favoriteName;
  });
}
