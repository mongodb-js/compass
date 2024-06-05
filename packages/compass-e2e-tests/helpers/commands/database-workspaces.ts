import { TEST_MULTIPLE_CONNECTIONS } from '../compass';
import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

// TODO: remove in favour of navigateToConnectionCollectionsTab
export async function navigateToDatabaseCollectionsTab(
  browser: CompassBrowser,
  dbName: string
): Promise<void> {
  if (TEST_MULTIPLE_CONNECTIONS) {
    throw new Error(
      'Use a different custom command that takes into account the connection name'
    );
  }

  await browser.navigateToInstanceTab('Databases');
  await browser.clickVisible(Selectors.databaseCardClickable(dbName));
  await waitUntilActiveDatabaseTab(browser, dbName);
}

// TODO: remove in favour of waitUntilActiveConnectionDatabaseTab
export async function waitUntilActiveDatabaseTab(
  browser: CompassBrowser,
  dbName: string
) {
  if (TEST_MULTIPLE_CONNECTIONS) {
    throw new Error(
      'Use a different custom command that takes into account the connection name'
    );
  }

  await browser
    .$(Selectors.databaseWorkspaceTab(dbName, true))
    .waitForDisplayed();
}

export async function navigateToConnectionCollectionsTab(
  browser: CompassBrowser,
  connectionName: string,
  dbName: string
): Promise<void> {
  if (!TEST_MULTIPLE_CONNECTIONS) {
    return navigateToDatabaseCollectionsTab(browser, dbName);
  }

  await browser.navigateToConnectionTab(connectionName, 'Databases');
  await browser.clickVisible(Selectors.databaseCardClickable(dbName));
  await waitUntilActiveConnectionDatabaseTab(browser, connectionName, dbName);
}

export async function waitUntilActiveConnectionDatabaseTab(
  browser: CompassBrowser,
  connectionName: string,
  dbName: string
) {
  // TODO: take into account connectionName
  await browser
    .$(Selectors.databaseWorkspaceTab(dbName, true))
    .waitForDisplayed();
}
