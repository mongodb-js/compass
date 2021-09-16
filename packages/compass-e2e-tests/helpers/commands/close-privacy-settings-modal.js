const Selectors = require('../selectors');

module.exports = function (app) {
  return async function closePrivacySettingsModal() {
    const { client } = app;

    if (
      !(await client.existsEventually(Selectors.PrivacySettingsModal, 5000))
    ) {
      return;
    }

    await client.waitForVisible(Selectors.PrivacySettingsModal);
    await client.clickVisible(Selectors.ClosePrivacySettingsButton);
    await client.waitForVisible(Selectors.PrivacySettingsModal, 2000, true);
  };
};
