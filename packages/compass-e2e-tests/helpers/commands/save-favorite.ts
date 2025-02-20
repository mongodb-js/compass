import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

// TODO(COMPASS-8023): Provide a counterpart `browser.saveConnection` method to
// be able to edit existing connection
export async function saveFavorite(
  browser: CompassBrowser,
  favoriteName: string,
  color: string
): Promise<void> {
  // this assumes that the checkbox is unchecked
  await browser.clickParent(Selectors.ConnectionFormFavoriteCheckbox);
  await browser.setValueVisible(
    Selectors.ConnectionFormConnectionName,
    favoriteName
  );
  await browser.selectOption(Selectors.ConnectionFormConnectionColor, color);

  await browser.clickVisible(Selectors.ConnectionModalSaveButton);
  await browser.$(Selectors.ConnectionModal).waitForExist({ reverse: true });
  return;
}
