const Selectors = require('../selectors');

const { expect } = require('chai');

module.exports = function (app) {
  return async function navigateToDatabaseTab(dbName, tabName) {
    const { client } = app;

    await client.navigateToInstanceTab('Databases');

    await client.click(`[data-test-id="databases-table-link-${dbName}"]`);

    // there is only the one tab for now, so this just just an assertion
    expect(tabName).to.equal('Collections');

    const tabSelector = `${Selectors.DatabaseTab}[name="${tabName}"]`;
    const tabSelectedSelector = `${tabSelector}[aria-selected="true"]`;

    await client.waitForVisible(tabSelectedSelector);
  };
};
