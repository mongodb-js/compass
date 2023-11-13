import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

export async function dropCollectionFromSidebar(
  browser: CompassBrowser,
  dbName: string,
  collectionName: string
): Promise<void> {
  // search for the collecton in the sidebar filter
  await browser.clickVisible(Selectors.SidebarFilterInput);
  const sidebarFilterInputElement = await browser.$(
    Selectors.SidebarFilterInput
  );
  await sidebarFilterInputElement.setValue(collectionName);
  const dbElement = await browser.$(Selectors.sidebarDatabase(dbName));
  await dbElement.waitForDisplayed();

  // wait for the collection to become displayed
  const collectionSelector = Selectors.sidebarCollection(
    dbName,
    collectionName
  );
  await browser.scrollToVirtualItem(
    Selectors.SidebarDatabaseAndCollectionList,
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
  await browser.clickVisible(Selectors.CollectionShowActionsButton);
  await browser.clickVisible(Selectors.DropCollectionButton);

  await browser.dropNamespace(collectionName);

  // wait for it to be gone
  await collectionElement.waitForExist({ reverse: true });
}
