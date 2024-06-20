import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import { expect } from 'chai';

export async function saveFavorite(
  browser: CompassBrowser,
  favoriteName: string,
  // TODO(COMPASS-8003): make color optional for multiple connections
  color: `color${number}` | string
): Promise<void> {
  if (TEST_MULTIPLE_CONNECTIONS) {
    // this assumes that the checkbox is unchecked
    // TODO(COMPASS-8003): opt into checking the favorite checkbox because not
    // all named connections are favorites.
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

  await browser.clickVisible(Selectors.ConnectionEditFavouriteButton);
  await browser.$(Selectors.FavoriteModal).waitForDisplayed();
  await browser.setValueVisible(Selectors.FavoriteNameInput, favoriteName);
  await browser.clickVisible(
    `${Selectors.FavoriteColorSelector} [data-testid="color-pick-${color}"]`
  );
  await browser.$(Selectors.FavoriteSaveButton).waitForEnabled();
  expect(await browser.$(Selectors.FavoriteSaveButton).getText()).to.equal(
    'Save'
  );

  await browser.screenshot('save-favorite-modal.png');

  await browser.clickVisible(Selectors.FavoriteSaveButton);
  await browser.$(Selectors.FavoriteModal).waitForExist({ reverse: true });
}
