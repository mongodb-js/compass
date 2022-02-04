import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function addCollection(
  browser: CompassBrowser,
  collectionName: string
  // TODO: options for capped collection, use custom collation and time-series
): Promise<void> {
  const createModalElement = await browser.$(Selectors.CreateCollectionModal);
  await createModalElement.waitForDisplayed();
  const collectionInput = await browser.$(
    Selectors.CreateDatabaseCollectionName
  );
  await collectionInput.setValue(collectionName);
  await browser.clickVisible(Selectors.CreateCollectionCreateButton);
  await createModalElement.waitForDisplayed({ reverse: true });
}
