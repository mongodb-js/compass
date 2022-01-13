const Selectors = require('../selectors');

module.exports = function (compass) {
  return async function doConnect(timeout) {
    const { browser } = compass;
    await browser.clickVisible(Selectors.ConnectButton);
    // First meaningful thing on the screen after being connected, good enough
    // indicator that we are connected to the server
    const element = await browser.$(Selectors.DatabasesTable);
    await element.waitForDisplayed({
      timeout,
    });
  };
};
