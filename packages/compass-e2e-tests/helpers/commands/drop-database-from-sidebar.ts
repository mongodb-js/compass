import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function dropDatabaseFromSidebar(
  browser: CompassBrowser,
  connectionName: string,
  dbName: string
): Promise<void> {
  const connectionId = await browser.getConnectionIdByName(connectionName);

  // search for the database in the sidebar filter
  await browser.clickVisible(Selectors.SidebarFilterInput);
  await browser.setValueVisible(Selectors.SidebarFilterInput, dbName);
  await browser
    .$(Selectors.sidebarDatabase(connectionId, dbName))
    .waitForDisplayed();

  // open the drop database modal from the sidebar
  await browser.hover(Selectors.sidebarDatabase(connectionId, dbName));

  await browser.clickVisible(Selectors.DropDatabaseButton);

  await browser.dropNamespace(dbName);

  // wait for it to be gone
  await browser
    .$(Selectors.sidebarDatabase(connectionId, dbName))
    .waitForExist({ reverse: true });
}
