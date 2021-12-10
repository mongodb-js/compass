const { delay } = require('../delay');
const Selectors = require('../selectors');

async function closeConnectionModal(app, page) {
  await page.click(Selectors.CancelConnectionButton);
  await page.waitForSelector(Selectors.ConnectionStatusModalContent, { state: 'detached' });
}

module.exports = function (app, page) {
  return async function () {
    const cancelConnectionButton = page.locator(
      Selectors.CancelConnectionButton
    );
    // If we are still connecting, let's try cancelling the connection first
    if (await cancelConnectionButton.isVisible()) {
      try {
        await closeConnectionModal(app, page);
      } catch (err) {
        // If that failed, the button was probably gone before we managed to
        // click it. Let's go through the whole disconnecting flow now
        console.warn(err.stack);
      }
    }

    // TODO: get rid of this
    await delay(100);

    app.webContents.send('app:disconnect');

    await page.waitForSelector(Selectors.ConnectSection);

    await page.click(Selectors.SidebarNewConnectionButton);

    // TODO: get rid of this
    await delay(100);
  };
};
