const { delay } = require('../delay');
const Selectors = require('../selectors');

async function closeConnectionModal(app) {
  try {
    await app.client.clickVisible(Selectors.CancelConnectionButton);
    await app.client.waitUntilGone(Selectors.ConnectionStatusModalContent, {
      timeoutMsg: 'Expected connection status modal to disappear after cancelling the connection'
    });
  } catch (e) {
    // If that failed, the button was probably gone before we managed to
    // click it. Let's go through the whole disconnecting flow now
  }
}

module.exports = function(app) {
  return async function () {
    // If we are still connecting, let's try cancelling the connection first
    if (await app.client.isVisible(Selectors.CancelConnectionButton)) {
      await closeConnectionModal(app)
    }
    app.webContents.send('app:disconnect');
    await app.client.waitForVisible(Selectors.ConnectSection, 5000);
    // Show "new connection" section as if we just opened this screen
    await app.client.clickVisible(Selectors.SidebarNewConnectionButton);
    await delay(100);
  };
};
