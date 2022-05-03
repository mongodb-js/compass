import type { CompassBrowser } from '../compass-browser';
import * as Selectors from '../selectors';

async function navigateToCollection(
  browser: CompassBrowser,
  dbName: string,
  collectionName: string
): Promise<void> {
  const headerSelector = Selectors.collectionHeaderTitle(
    dbName,
    collectionName
  );
  const collectionSelector = Selectors.sidebarCollection(
    dbName,
    collectionName
  );

  const headerElement = await browser.$(headerSelector);

  // Close all the workspace tabs to get rid of all the state we
  // might have accumulated. This is the only way to get back to the zero
  // state of Schema, Explain Plan and Validation tabs without re-connecting.
  await browser.closeWorkspaceTabs();

  // search for the collection and wait for the collection to be there and visible
  await browser.clickVisible(Selectors.SidebarFilterInput);
  const sidebarFilterInputElement = await browser.$(
    Selectors.SidebarFilterInput
  );
  await sidebarFilterInputElement.setValue(collectionName);
  const collectionElement = await browser.$(collectionSelector);

  await collectionElement.waitForDisplayed();

  // click it and wait for the collection header to become visible
  await browser.clickVisible(collectionSelector);
  await headerElement.waitForDisplayed();
}

export async function navigateToCollectionTab(
  browser: CompassBrowser,
  dbName: string,
  collectionName: string,
  tabName: string
): Promise<void> {
  const tabSelector = Selectors.collectionTab(tabName);
  const tabSelectedSelector = Selectors.collectionTab(tabName, true);

  await navigateToCollection(browser, dbName, collectionName);

  const tabSelectedSelectorElement = await browser.$(tabSelectedSelector);
  // if the correct tab is already visible, do nothing
  if (await tabSelectedSelectorElement.isExisting()) {
    return;
  }

  // otherwise select the tab and wait for it to become selected
  await browser.clickVisible(tabSelector);

  await tabSelectedSelectorElement.waitForDisplayed();
}
