import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function addDatabase(
  browser: CompassBrowser,
  dbName: string,
  collectionName: string
  // TODO: options for capped collection, use custom collation and time-series
): Promise<void> {
  const createModalElement = await browser.$(Selectors.CreateDatabaseModal);
  await createModalElement.waitForDisplayed();
  const dbInput = await browser.$(Selectors.CreateDatabaseDatabaseName);
  await dbInput.setValue(dbName);
  const collectionInput = await browser.$(
    Selectors.CreateDatabaseCollectionName
  );
  await collectionInput.setValue(collectionName);
  const createButton = await browser.$(Selectors.CreateDatabaseCreateButton);
  await createButton.waitForEnabled();
  await createButton.click();
  await createModalElement.waitForDisplayed({ reverse: true });
}
