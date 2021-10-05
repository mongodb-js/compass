const { delay } = require('../delay');
const Selectors = require('../selectors');

async function closeConnectionModal(app) {
  const { client } = app;
  await client.clickVisible(Selectors.CancelConnectionButton);
  // <<<<<<< HEAD
  const connectionModalContentElement = await client.$(
    Selectors.ConnectionStatusModalContent
  );
  // =======
  //   await client.waitForExist(
  //     Selectors.ConnectionStatusModalContent,
  //     undefined,
  //     false
  // >>>>>>> main
  // );
  await connectionModalContentElement.waitForExist({
    timeout: 1000,
    reverse: true,
  });
}

module.exports = function (app) {
  return async function () {
    const { client } = app;

    const cancelConnectionButtonElement = await client.$(
      Selectors.CancelConnectionButton
    );
    // If we are still connecting, let's try cancelling the connection first
    if (await cancelConnectionButtonElement.isDisplayed()) {
      try {
        await closeConnectionModal(app);
      } catch (e) {
        // If that failed, the button was probably gone before we managed to
        // click it. Let's go through the whole disconnecting flow now
      }
    }

    app.webContents.send('app:disconnect');

    const element = await client.$(Selectors.ConnectSection);
    await element.waitForDisplayed({
      timeout: 5000,
    });

    await client.clickVisible(Selectors.SidebarNewConnectionButton);
    await delay(100);
  };
};
