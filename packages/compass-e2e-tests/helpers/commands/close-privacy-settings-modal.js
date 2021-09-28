const Selectors = require('../selectors');

module.exports = function (app) {
  return async function closePrivacySettingsModal() {
    const { client } = app;

    if (!(await client.existsEventually(Selectors.PrivacySettingsModal))) {
      return;
    }

    await client.waitForVisible(Selectors.PrivacySettingsModal);
    await client.clickVisible(Selectors.ClosePrivacySettingsButton);
    await client.waitForVisible(
      Selectors.PrivacySettingsModal,
      undefined,
      true
    );
  };
};
