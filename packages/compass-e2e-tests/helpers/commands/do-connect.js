const Selectors = require('../selectors');

module.exports = function (app) {
  return async function doConnect(timeout = 10000) {
    const { client } = app;
    await client.clickVisible(Selectors.ConnectButton);
    // First meaningful thing on the screen after being connected, good enough
    // indicator that we are connected to the server
    const element = await app.client.$(Selectors.DatabasesTable);
    await element.waitForVisible(timeout);

    // // indicator that we are connected to the server.
    // const element = await app.client.$(Selectors.DatabasesTable);
    // if (!(await element.isDisplayed())) {
    //   await app.client.waitForElement(Selectors.DatabasesTable, {
    //     visibleError: 'Expected databases table to be visible',
    //     timeout
    //   });
    // }
  };
};
