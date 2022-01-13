const { delay } = require('../delay');
const Selectors = require('../selectors');

async function closeConnectionModal(compass) {
  const { browser } = compass;
  await browser.clickVisible(Selectors.CancelConnectionButton);
  const connectionModalContentElement = await browser.$(
    Selectors.ConnectionStatusModalContent
  );
  await connectionModalContentElement.waitForExist({
    reverse: true,
  });
}

module.exports = function (compass) {
  return async function () {
    const { browser } = compass;

    const cancelConnectionButtonElement = await browser.$(
      Selectors.CancelConnectionButton
    );
    // If we are still connecting, let's try cancelling the connection first
    if (await cancelConnectionButtonElement.isDisplayed()) {
      try {
        await closeConnectionModal(compass);
      } catch (e) {
        // If that failed, the button was probably gone before we managed to
        // click it. Let's go through the whole disconnecting flow now
      }
    }

    await delay(100);

    // TODO
    compass.webContents.send('app:disconnect');

    const element = await browser.$(Selectors.ConnectSection);
    await element.waitForDisplayed();

    await browser.clickVisible(Selectors.SidebarNewConnectionButton);
    await delay(100);
  };
};
