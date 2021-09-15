const Selectors = require('../selectors');

module.exports = function (app) {
  return async function navigateToDatabaseTab(dbName) {
    const { client } = app;

    await client.navigateToInstanceTab('database');

    // somehow click on the db name
    await client.click(`[data-test-id="databases-table"] a:contains("${dbName}")`);
  };
};
