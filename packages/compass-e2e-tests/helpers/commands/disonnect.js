const { delay } = require('../delay');
const Selectors = require('../selectors');

module.exports = function(app) {
  return async function () {
    // If we are still connecting, let's try cancelling the connection first
    if (await app.client.isVisible(Selectors.CancelConnectionButton)) {
      try {
        await app.client.clickVisible(Selectors.CancelConnectionButton);
        await app.client.waitUntil(async () => {
          return !(await app.client.isExisting(
            Selectors.ConnectionStatusModalContent
          ),
          1000,
          'Expected connection status modal to disappear after cancelling the connection',
          50);
        });
        return;
      } catch (e) {
        // If that failed, the button was probably gone before we managed to
        // click it. Let's go through the whole disconnecting flow now
      }
    }
    app.webContents.send('app:disconnect');
    await app.client.waitForVisible(Selectors.ConnectSection, 5000);
    // Show "new connection" section as if we just opened this screen
    await app.client.clickVisible(Selectors.SidebarNewConnectionButton);
    await delay(100);
  };
};
