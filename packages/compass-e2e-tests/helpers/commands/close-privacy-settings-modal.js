const Selectors = require('../selectors');



module.exports = function (app) {
  return async function closePrivacySettingsModal() {
    if (!await app.client.existsEventually(Selectors.PrivacySettingsModal, 1000)) {
      return;
    }

    await app.client.waitForVisible(Selectors.PrivacySettingsModal);
    await app.client.clickVisible(Selectors.ClosePrivacySettingsButton);
    await app.client.waitForExist(Selectors.PrivacySettingsModal, 1000, false);
  };
};
