import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function dropDatabaseFromSidebar(
  browser: CompassBrowser,
  dbName: string
): Promise<void> {
  // search for the database in the sidebar filter
  await browser.clickVisible(Selectors.SidebarFilterInput);
  const sidebarFilterInputElement = await browser.$(
    Selectors.SidebarFilterInput
  );
  await sidebarFilterInputElement.setValue(dbName);
  await browser.$(Selectors.sidebarDatabase(dbName)).waitForDisplayed();

  // open the drop database modal from the sidebar
  await browser.hover(Selectors.sidebarDatabase(dbName));

  await browser.clickVisible(Selectors.DropDatabaseButton);

  await browser.dropNamespace(dbName);

  // wait for it to be gone
  await browser
    .$(Selectors.sidebarDatabase(dbName))
    .waitForExist({ reverse: true });
}
