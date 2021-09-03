const Selectors = require('../selectors');

module.exports = function(app) {
  return async function closePrivacySettingsModal() {
    const exists = await app.client.waitForElement(
      Selectors.PrivacySettingsModal,
      {
        mustExist: false,
        visibleError: 'Expected privacy settings modal to be visible'
      }
    );

    if (!exists) {
      return;
    }

    await app.client.clickVisible(Selectors.ClosePrivacySettingsButton);

    await app.client.waitUntilGone(Selectors.PrivacySettingsModal, {
      timeoutMsg: 'Expected privacy settings modal to disappear after closing it'
    });
  };
};
