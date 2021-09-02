const { delay } = require('../delay');
const Selectors = require('../selectors');

module.exports = function(app) {
  return async function closePrivacySettingsModal() {
    // Wait a bit in any case if it exists or doesn't just so it has a chance to
    // render if possible
    await delay(1000);
    if (await app.client.isExisting(Selectors.PrivacySettingsModal)) {
      await app.client.waitUntil(
        async () => {
          return await app.client.isVisible(Selectors.PrivacySettingsModal);
        },
        1000,
        'Expected privacy settings modal to be visible',
        50
      );
      // Wait a bit before clicking so that transition is through
      await delay(100);
      await app.client.clickVisible(Selectors.ClosePrivacySettingsButton);
      await app.client.waitUntil(
        async () => {
          return !(await app.client.isExisting(
            Selectors.PrivacySettingsModal
          ));
        },
        5000,
        'Expected privacy settings modal to disappear after closing it',
        50
      );
    }
  };
};
