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
  const createModalElement = browser.$(Selectors.CreateDatabaseModal);
  await createModalElement.waitForDisplayed();
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
  await createModalElement.waitForDisplayed({ reverse: true });
}
