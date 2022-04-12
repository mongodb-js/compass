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

  // If we're not finding the collection in the sidebar immediately,
  // click the refresh button on the sidebar. This mostly handles the case
  // in which we've connected Compass in a before() hook, but the
  // insert-test-data hooks in the beforeEach() hook have not run yet,
  // but also makes the tests more resilient in general.
  let foundCollection = false;
  const refreshSidebarPromise = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000).unref());
    if (foundCollection) {
      return;
    }
    // If the collection is not found after 1 second, refresh.
    await browser.clickVisible(Selectors.SidebarInstanceRefreshButton);
    const refreshIdleIcon = await browser.$(
      Selectors.SidebarInstanceRefreshIdle
    );
    await refreshIdleIcon.waitForDisplayed();
    // TODO: Figure out why we first need to clear the search element here
    await sidebarFilterInputElement.setValue('');
    await sidebarFilterInputElement.setValue(collectionName);
  };
  await Promise.race([
    collectionElement.waitForDisplayed(),
    refreshSidebarPromise,
  ]);
  foundCollection = true;

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
