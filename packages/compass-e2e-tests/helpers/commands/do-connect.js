const Selectors = require('../selectors');

module.exports = function (app, page) {
  return async function doConnect(timeout) {
    await page.click(Selectors.ConnectButton);
    // First meaningful thing on the screen after being connected, good enough
    // indicator that we are connected to the server
    await page.waitForSelector(Selectors.DatabasesTable, { timeout });
  };
};
