import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

import type { AddCollectionOptions } from './add-collection';

export async function addDatabase(
  browser: CompassBrowser,
  dbName: string,
  collectionName: string,
  collectionOptions?: AddCollectionOptions,
  screenshotPath?: string
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

  if (screenshotPath) {
    await browser.screenshot(screenshotPath);
  }

  await createButton.click();
  await createModalElement.waitForDisplayed({ reverse: true });
}
