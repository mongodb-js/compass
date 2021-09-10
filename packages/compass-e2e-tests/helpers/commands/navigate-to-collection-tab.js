const Selectors = require('../selectors');

module.exports = function (app) {
  const { client } = app;

  async function navigateToCollection(dbName, collectionName) {
    const headerSelector = `${Selectors.CollectionHeaderTitle}[title="${dbName}.${collectionName}"]`;
    const collectionSelector = `${Selectors.SidebarCollection}[title="${dbName}.${collectionName}"]`;

    // if the collection header is already visible we don't have to browse to the collection
    if (await client.isExisting(headerSelector)) {
      return;
    }

    // search for the collection and wait for the collection to be there and visible
    await client.clickVisible(Selectors.SidebarFilterInput);
    await client.setValue(Selectors.SidebarFilterInput, collectionName);
    await client.waitForVisible(collectionSelector);

    // click it and wait for the collection header to become visible
    await client.click(collectionSelector);
    await client.waitForVisible(headerSelector);
  }

  return async function navigateToCollectionTab(dbName, collectionName, tabName) {
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
  }
}
