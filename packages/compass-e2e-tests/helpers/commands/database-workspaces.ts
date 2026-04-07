import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';
import type { WorkspaceTabSelectorOptions } from '../selectors.ts';

export async function navigateToDatabaseCollectionsTab(
  browser: CompassBrowser,
  connectionName: string,
  dbName: string
): Promise<void> {
  await browser.navigateToConnectionTab(connectionName, 'Databases');
  await browser.clickVisible(`${Selectors.databaseRow(dbName)} td:first-child`);
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
