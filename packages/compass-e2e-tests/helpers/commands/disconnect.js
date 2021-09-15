const { delay } = require('../delay');
const Selectors = require('../selectors');

async function closeConnectionModal(app) {
  const { client } = app;
  await client.clickVisible(Selectors.CancelConnectionButton);
  await client.waitForExist(
    Selectors.ConnectionStatusModalContent,
    1000,
    false
  );
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
    // await client.waitForVisible(Selectors.ConnectSection, 5000);

    const element = await client.$(Selectors.ConnectSection);
    await element.waitForVisible(5000);

    // await client.waitUntil(
    //   async () => {
    //     const element = await client.$(Selectors.ConnectSection);
    //     return await element.isDisplayed();
    //   },
    //   {
    //     timeout: 5000,
    //     timeoutMsg:
    //        'Expected connection screen to be visible after disconnecting',
    //     interval: 50
    //   }
    // );

    // Show "new connection" section as if we just opened this screen
    await client.clickVisible(Selectors.SidebarNewConnectionButton);
    await delay(100);
  };
};
