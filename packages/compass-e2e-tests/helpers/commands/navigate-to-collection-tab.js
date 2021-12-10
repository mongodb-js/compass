const Selectors = require('../selectors');

module.exports = function (app, page, commands) {
  async function navigateToCollection(dbName, collectionName) {
    const headerSelector = Selectors.collectionHeaderTitle(
      dbName,
      collectionName
    );
    const collectionSelector = Selectors.sidebarCollection(
      dbName,
      collectionName
    );

    // Close all the collection tabs to get rid of all the state we might have accumulated. This is the only way to get back to the zero state of Schema, Explain Plan and Validation tabs without re-connecting.
    await commands.closeCollectionTabs();

    // Search for the collection and wait for the collection to be there and visible
    await page.click(Selectors.SidebarFilterInput);
    await page.fill(Selectors.SidebarFilterInput, collectionName);
    await page.waitForSelector(collectionSelector);

    // Click it and wait for the collection header to become visible
    await page.click(collectionSelector);
    await page.waitForSelector(headerSelector);
  }

  return async function navigateToCollectionTab(
    dbName,
    collectionName,
    tabName
  ) {
    const tabSelector = Selectors.collectionTab(tabName);
    const tabSelectedSelector = Selectors.collectionTab(tabName, true);

    await navigateToCollection(dbName, collectionName);

    const tab = page.locator(tabSelectedSelector);
    // if the correct tab is already visible, do nothing
    if (await tab.isVisible()) {
      return;
    }

    // otherwise select the tab and wait for it to become selected
    await page.click(tabSelector);

    await tab.waitFor();
  };
};
