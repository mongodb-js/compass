import type { CompassBrowser } from '../compass-browser.ts';
import * as Selectors from '../selectors.ts';

export async function dropDatabaseFromSidebar(
  browser: CompassBrowser,
  connectionName: string,
  dbName: string
): Promise<void> {
  const connectionId = await browser.pages.sidebar.getConnectionIdByName(
    connectionName
  );

  // search for the database in the sidebar filter
  await browser.clickVisible(browser.pages.sidebar.$filterInput);
  await browser.setValueVisible(browser.pages.sidebar.$filterInput, dbName);
  await browser
    .$(Selectors.sidebarDatabase(connectionId, dbName))
    .waitForDisplayed();

  // open the drop database modal from the sidebar
  await browser.hover(Selectors.sidebarDatabase(connectionId, dbName));

  await browser.clickVisible(Selectors.DropDatabaseButton);

  // Start the drop and wait for it to be gone
  await Promise.all([
    browser.dropNamespace(dbName),
    browser
      .$(Selectors.sidebarDatabase(connectionId, dbName))
      .waitForExist({ reverse: true }),
  ]);
}
