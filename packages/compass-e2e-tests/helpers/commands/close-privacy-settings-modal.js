const Selectors = require('../selectors');

module.exports = function (app) {
  return async function closePrivacySettingsModal() {
    const { client } = app;

    const privateSettingsModalElement = await client.$(
      Selectors.PrivacySettingsModal
    );

    try {
      await privateSettingsModalElement.waitForExist();
    } catch (err) {
      return;
    }

    await client.clickVisible(Selectors.ClosePrivacySettingsButton);
    await privateSettingsModalElement.waitForDisplayed({
      reverse: true,
    });
  };
};
