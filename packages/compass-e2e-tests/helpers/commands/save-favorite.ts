import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import { expect } from 'chai';

export async function saveFavorite(
  browser: CompassBrowser,
  favoriteName: string,
  color: `color${number}`
): Promise<void> {
  await browser.clickVisible(Selectors.ConnectionFormEditFavouriteButton);
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
