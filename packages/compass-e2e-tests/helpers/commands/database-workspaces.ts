import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';
import type { WorkspaceTabSelectorOptions } from '../selectors';

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
  const options: WorkspaceTabSelectorOptions = {
    connectionName,
    namespace: dbName,
    active: true,
  };

  await browser.$(Selectors.workspaceTab(options)).waitForDisplayed();
}
