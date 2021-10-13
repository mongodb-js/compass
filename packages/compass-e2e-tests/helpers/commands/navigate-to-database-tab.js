const Selectors = require('../selectors');

const { expect } = require('chai');

module.exports = function (app) {
  return async function navigateToDatabaseTab(dbName, tabName) {
    const { client } = app;

    await client.navigateToInstanceTab('Databases');

    await client.clickVisible(Selectors.databaseTableLink(dbName));

    // there is only the one tab for now, so this just just an assertion
    expect(tabName).to.equal('Collections');

    const tabSelectedSelector = Selectors.databaseTab(tabName, true);

    const tabSelectorElement = await client.$(tabSelectedSelector);
    await tabSelectorElement.waitForDisplayed();
  };
};
