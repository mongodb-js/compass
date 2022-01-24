const Selectors = require('../selectors');

const { expect } = require('chai');

module.exports = function (compass) {
  return async function navigateToDatabaseTab(dbName, tabName) {
    const { browser } = compass;

    await browser.navigateToInstanceTab('Databases');

    await browser.clickVisible(Selectors.databaseCard(dbName));

    // there is only the one tab for now, so this just just an assertion
    expect(tabName).to.equal('Collections');

    const tabSelectedSelector = Selectors.databaseTab(tabName, true);

    const tabSelectorElement = await browser.$(tabSelectedSelector);
    await tabSelectorElement.waitForDisplayed();
  };
};
