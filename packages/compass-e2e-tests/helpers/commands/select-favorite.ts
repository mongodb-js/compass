import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function selectFavorite(
  browser: CompassBrowser,
  favoriteName: string
): Promise<void> {
  // Usually we use this after disconnecting. I'm just trying to see where the
  // race condition is - are we clicking too quickly or is the act of clicking
  // causing something to re-render and the element to go stale?
  await browser.pause(1000);

  await browser.clickVisible(Selectors.sidebarFavoriteButton(favoriteName), {
    screenshot: 'selecting-favourite.png',
  });
  await browser.waitUntil(async () => {
    const text = await browser.$(Selectors.ConnectionTitle).getText();
    return text === favoriteName;
  });
}
