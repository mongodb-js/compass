import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

type AddDatabaseOptions = {
  // Intentionally empty. Just here as placeholder to make it the same as addCollection
};

export async function addDatabase(
  browser: CompassBrowser,
  dbName: string,
  collectionName: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options?: AddDatabaseOptions,
  screenshotPath?: string
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

  if (screenshotPath) {
    await browser.screenshot(screenshotPath);
  }

  const createButton = await browser.$(Selectors.CreateDatabaseCreateButton);
  await createButton.waitForEnabled();
  await createButton.click();
  await createModalElement.waitForDisplayed({ reverse: true });
}
