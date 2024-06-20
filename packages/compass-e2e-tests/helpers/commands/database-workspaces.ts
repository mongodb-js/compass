import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function navigateToDatabaseCollectionsTab(
  browser: CompassBrowser,
  connectionName: string,
  dbName: string
): Promise<void> {
  await browser.navigateToConnectionTab(connectionName, 'Databases');
  await browser.clickVisible(Selectors.databaseCardClickable(dbName));
  await waitUntilActiveDatabaseTab(browser, connectionName, dbName);
}

export async function waitUntilActiveDatabaseTab(
  browser: CompassBrowser,
  connectionName: string,
  dbName: string
) {
  // TODO(COMPASS-8002): check that the connectionName matches too
  await browser
    .$(Selectors.databaseWorkspaceTab(dbName, true))
    .waitForDisplayed();
}
