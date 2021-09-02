const Selectors = require('../selectors');

module.exports = function(app) {
  return async function doConnect(timeout = 10000) {
    await app.client.clickVisible(Selectors.ConnectButton);
    // First meaningful thing on the screen after being connected, good enough
    // indicator that we are connected to the server
    await app.client.waitForVisible(Selectors.DatabasesTable, timeout);
  };
};
