const Selectors = require('../selectors');

module.exports = function (compass) {
  return async function doConnect(timeout, expectSuccess = true) {
    const { browser } = compass;
    await browser.clickVisible(Selectors.ConnectButton);
    if (expectSuccess) {
      // First meaningful thing on the screen after being connected, good enough
      // indicator that we are connected to the server
      const element = await browser.$(Selectors.DatabasesTable);
      await element.waitForDisplayed({
        timeout,
      });
    } else {
      const element = await browser.$(Selectors.ConnectionFormMessage);
      await element.waitForDisplayed({
        timeout,
      });
    }
  };
};
