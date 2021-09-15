const Selectors = require('../selectors');

module.exports = function (app) {
  return async function closePrivacySettingsModal() {
    const { client } = app;

    // if (
    //   !(await client.existsEventually(Selectors.PrivacySettingsModal, 5000))
    // ) {
    //   return;
    // }

    const privateSettingsModalElement = await client.$(
      Selectors.PrivacySettingsModal
    );

    try {
      await privateSettingsModalElement.waitForExist({
        timeout: 5000,
      });
    } catch (err) {
      return;
    }

    // await privateSettingsModalElement.waitForDisplayed();
    await client.clickVisible(Selectors.ClosePrivacySettingsButton);
    await privateSettingsModalElement.waitForDisplayed({
      timeout: 2000,
      interval: 50,
      reverse: true,
    });
  };
};
