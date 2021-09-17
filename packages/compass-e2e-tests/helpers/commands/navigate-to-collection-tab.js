const Selectors = require('../selectors');

module.exports = function (app) {
  async function navigateToCollection(dbName, collectionName) {
    const { client } = app;

    const headerSelector = `${Selectors.CollectionHeaderTitle}[title="${dbName}.${collectionName}"]`;
    const collectionSelector = `${Selectors.SidebarCollection}[title="${dbName}.${collectionName}"]`;

    // Close all the collection tabs to get rid of all the state we might have accumulated. This is the only way to get back to the zero state of Schema, Explain Plan and Validation tabs without re-connecting.
    await client.closeCollectionTabs();

    // search for the collection and wait for the collection to be there and visible
    await client.clickVisible(Selectors.SidebarFilterInput);
    await client.setValue(Selectors.SidebarFilterInput, collectionName);
    await client.waitForVisible(collectionSelector);

    // click it and wait for the collection header to become visible
    await client.click(collectionSelector);
    await client.waitForVisible(headerSelector);
  }

  return async function navigateToCollectionTab(
    dbName,
    collectionName,
    tabName
  ) {
    const { client } = app;

    const tabSelector = `${Selectors.CollectionTab}[name="${tabName}"]`;
    const tabSelectedSelector = `${tabSelector}[aria-selected="true"]`;

    await navigateToCollection(dbName, collectionName);

    // if the correct tab is already visible, do nothing
    if (await client.isExisting(tabSelectedSelector)) {
      return;
    }

    // otherwise select the tab and wait for it to become selected
    await client.click(tabSelector);
    await client.waitForVisible(tabSelectedSelector);
  };
};
