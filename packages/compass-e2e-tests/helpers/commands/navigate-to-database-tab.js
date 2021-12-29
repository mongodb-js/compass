const Selectors = require('../selectors');

const { expect } = require('chai');

module.exports = function (app, page, commands) {
  return async function navigateToDatabaseTab(dbName, tabName) {
    await commands.navigateToInstanceTab('Databases');

    await page.click(Selectors.databaseCard(dbName));

    // there is only the one tab for now, so this just just an assertion
    expect(tabName).to.equal('Collections');

    const tabSelectedSelector = Selectors.databaseTab(tabName, true);

    await page.waitForSelector(tabSelectedSelector);
  };
};
