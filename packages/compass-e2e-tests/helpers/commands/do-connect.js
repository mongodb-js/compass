const Selectors = require('../selectors');

module.exports = function (compass) {
  return async function doConnect(timeout, connectionStatus = 'success') {
    const { browser } = compass;
    await browser.clickVisible(Selectors.ConnectButton);
    let selector;
    if (connectionStatus === 'either') {
      // For the rare cases where we don't care whether it fails or succeeds
      selector = `${Selectors.DatabasesTable},${Selectors.ConnectionFormMessage}`;
    } else if (connectionStatus === 'success') {
      // First meaningful thing on the screen after being connected, good enough
      // indicator that we are connected to the server
      selector = Selectors.DatabasesTable;
    } else {
      selector = Selectors.ConnectionFormMessage;
    }
    const element = await browser.$(selector);
    await element.waitForDisplayed({
      timeout,
    });
  };
};
