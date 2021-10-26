const Selectors = require('../selectors');

module.exports = function (app) {
  return async function closePrivacySettingsModal() {
    const { client } = app;

    if (!(await client.existsEventually(Selectors.PrivacySettingsModal))) {
      return;
    }

    const privateSettingsModalElement = await client.$(
      Selectors.PrivacySettingsModal
    );

    await privateSettingsModalElement.waitForDisplayed();
    await client.clickVisible(Selectors.ClosePrivacySettingsButton);
    await privateSettingsModalElement.waitForDisplayed({
      reverse: true,
    });
  };
};
