import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
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
    type: 'Collections',
    namespace: dbName,
    active: true,
  };

  // Only add the connectionName for multiple connections because for some
  // reason this sometimes flakes in single connections even though the tab is
  // definitely there in the screenshot.
  if (TEST_MULTIPLE_CONNECTIONS) {
    options.connectionName = connectionName;
  }

  await browser.$(Selectors.workspaceTab(options)).waitForDisplayed();
}
