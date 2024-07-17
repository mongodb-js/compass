import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function dropCollectionFromSidebar(
  browser: CompassBrowser,
  connectionName: string,
  dbName: string,
  collectionName: string
): Promise<void> {
  const connectionId = await browser.getConnectionIdByName(connectionName);

  // search for the collecton in the sidebar filter
  await browser.clickVisible(Selectors.SidebarFilterInput);
  await browser.setValueVisible(Selectors.SidebarFilterInput, collectionName);
  const dbElement = await browser.$(
    Selectors.sidebarDatabase(connectionId, dbName)
  );
  await dbElement.waitForDisplayed();

  // wait for the collection to become displayed
  const collectionSelector = Selectors.sidebarCollection(
    connectionId,
    dbName,
    collectionName
  );
  await browser.scrollToVirtualItem(
    Selectors.SidebarNavigationTree,
    collectionSelector,
    'tree'
  );
  const collectionElement = await browser.$(collectionSelector);
  await collectionElement.waitForDisplayed();

  // open the drop collection modal from the sidebar
  await browser.hover(collectionSelector);

  // NOTE: if the menu was already open for another collection this could get
  // confusing. Also this selector is just for the actions button and it is
  // assumed that at this point it is the only one. But the drop confirmation
  // usually catches that.
  await browser.clickVisible(Selectors.SidebarNavigationItemShowActionsButton);
  await browser.clickVisible(Selectors.DropCollectionButton);

  await browser.dropNamespace(collectionName);

  // wait for it to be gone
  await collectionElement.waitForExist({ reverse: true });
}
