const Selectors = require('../selectors');

module.exports = function (app) {
  return async function doConnect(timeout, expectSuccess = true) {
    const { client } = app;
    await client.clickVisible(Selectors.ConnectButton);
    if (expectSuccess) {
      // First meaningful thing on the screen after being connected, good enough
      // indicator that we are connected to the server
      const element = await client.$(Selectors.DatabasesTable);
      await element.waitForDisplayed({
        timeout,
      });
    } else {
      const element = await client.$(Selectors.ConnectionFormMessage);
      await element.waitForDisplayed({
        timeout,
      });
    }
  };
};
