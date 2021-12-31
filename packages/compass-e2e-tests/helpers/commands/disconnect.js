const Selectors = require('../selectors');

async function closeConnectionModal(app, page) {
  await page.click(Selectors.CancelConnectionButton);
  await page.waitForSelector(Selectors.ConnectionStatusModalContent, {
    state: 'detached',
  });
}

module.exports = function (app, page) {
  return async function () {
    // If we are still connecting, let's try cancelling the connection first
    const cancelConnectionButton = page.locator(
      Selectors.CancelConnectionButton
    );
    if (await cancelConnectionButton.isVisible()) {
      try {
        await closeConnectionModal(app, page);
      } catch (err) {
        // If that failed, the button was probably gone before we managed to
        // click it. Let's go through the whole disconnecting flow now
        console.warn(err.stack);
      }

      await cancelConnectionButton.waitFor('hidden');
    }

    await page.evaluate(() => {
      require('electron').ipcRenderer.emit('app:disconnect');
    });
  };
};
