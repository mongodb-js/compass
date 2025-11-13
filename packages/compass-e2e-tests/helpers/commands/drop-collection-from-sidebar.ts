import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function dropCollectionFromSidebar(
  browser: CompassBrowser,
  connectionName: string,
  databaseName: string,
  collectionName: string
): Promise<void> {
  await browser.selectCollectionMenuItem(
    connectionName,
    databaseName,
    collectionName,
    'drop-collection'
  );

  const connectionId = await browser.getConnectionIdByName(connectionName);
  const collectionSelector = Selectors.sidebarCollection(
    connectionId,
    databaseName,
    collectionName
  );
  const collectionElement = browser.$(collectionSelector);

  // Start the drop and wait for it to be gone
  await Promise.all([
    collectionElement.waitForExist({ reverse: true }),
    browser.dropNamespace(collectionName),
  ]);
}
