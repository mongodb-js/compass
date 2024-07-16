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
  await browser
    .$(Selectors.workspaceTab({ connectionName, title: dbName, active: true }))
    .waitForDisplayed();
}
