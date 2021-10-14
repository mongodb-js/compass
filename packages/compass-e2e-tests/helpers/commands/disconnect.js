const { delay } = require('../delay');
const Selectors = require('../selectors');

async function closeConnectionModal(app) {
  const { client } = app;
  await client.clickVisible(Selectors.CancelConnectionButton);
  const connectionModalContentElement = await client.$(
    Selectors.ConnectionStatusModalContent
  );
  await connectionModalContentElement.waitForExist({
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

    await delay(100);

    app.webContents.send('app:disconnect');

    const element = await client.$(Selectors.ConnectSection);
    await element.waitForDisplayed();

    await client.clickVisible(Selectors.SidebarNewConnectionButton);
    await delay(100);
  };
};
