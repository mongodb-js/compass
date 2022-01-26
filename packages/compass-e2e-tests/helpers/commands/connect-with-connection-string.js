const Selectors = require('../selectors');

const defaultTimeoutMS = 30_000;

module.exports = function (compass) {
  return async function connectWithConnectionString(
    connectionString,
    timeout = defaultTimeoutMS,
    connectionStatus = 'success'
  ) {
    const { browser } = compass;
    await browser.setValueVisible(
      Selectors.ConnectionStringInput,
      connectionString
    );
    await browser.doConnect(timeout, connectionStatus);
  };
};
