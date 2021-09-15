const Selectors = require('../selectors');

module.exports = function (app) {
  async function navigateToCollection(dbName, collectionName) {
    const { client } = app;

    const headerSelector = `${Selectors.CollectionHeaderTitle}[title="${dbName}.${collectionName}"]`;
    const collectionSelector = `${Selectors.SidebarCollection}[title="${dbName}.${collectionName}"]`;

    const headerElement = await client.$(headerSelector);

    // if the collection header is already visible we don't have to browse to the collection
    if (await headerElement.isExisting()) {
      return;
    }

    // search for the collection and wait for the collection to be there and visible
    await client.clickVisible(Selectors.SidebarFilterInput);
    const sidebarFilterInputElement = await client.$(
      Selectors.SidebarFilterInput
    );
    await sidebarFilterInputElement.setValue(collectionName);
    const collectionElement = await client.$(collectionSelector);
    await collectionElement.waitForDisplayed();

    // click it and wait for the collection header to become visible
    await collectionElement.click();
    await headerElement.waitForDisplayed();
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

    const tabSelectedSelectorElement = await client.$(tabSelectedSelector);
    // if the correct tab is already visible, do nothing
    if (await tabSelectedSelectorElement.isExisting()) {
      return;
    }

    // otherwise select the tab and wait for it to become selected
    const tabSelectorElement = await client.$(tabSelector);
    await tabSelectorElement.click();

    await tabSelectedSelectorElement.waitForDisplayed();
  };
};
