import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

import type { AddCollectionOptions } from './add-collection.ts';

export async function addDatabase(
  browser: CompassBrowser,
  dbName: string,
  collectionName: string,
  collectionOptions?: AddCollectionOptions,
  screenshotPath?: string
): Promise<void> {
  await browser.waitForOpenModal(Selectors.CreateDatabaseModal);
  await browser.setValueVisible(Selectors.CreateDatabaseDatabaseName, dbName);
  await browser.setValueVisible(
    Selectors.CreateDatabaseCollectionName,
    collectionName
  );
  const createButton = browser.$(Selectors.CreateDatabaseCreateButton);
  await createButton.waitForEnabled();

  if (screenshotPath) {
    await browser.screenshot(screenshotPath);
  }

  await createButton.click();
  await browser.waitForOpenModal(Selectors.CreateDatabaseModal, {
    reverse: true,
  });
}
