import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import { expect } from 'chai';

// TODO(COMPASS-8023): Just remove this command and use
// setConnectionFormState() once we remove the single connection code
export async function saveFavorite(
  browser: CompassBrowser,
  favoriteName: string,
  color: `color${number}` | string
): Promise<void> {
  if (TEST_MULTIPLE_CONNECTIONS) {
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
  await browser.clickVisible(Selectors.FavoriteSaveButton);
  await browser.$(Selectors.FavoriteModal).waitForExist({ reverse: true });
}
