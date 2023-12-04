import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function navigateToDatabaseCollectionsTab(
  browser: CompassBrowser,
  dbName: string
): Promise<void> {
  await browser.navigateToInstanceTab('Databases');
  await browser.clickVisible(Selectors.databaseCardClickable(dbName));
  await waitUntilActiveDatabaseTab(browser, dbName);
}

export async function waitUntilActiveDatabaseTab(
  browser: CompassBrowser,
  dbName: string
) {
  await browser
    .$(Selectors.databaseWorkspaceTab(dbName, true))
    .waitForDisplayed();
}
