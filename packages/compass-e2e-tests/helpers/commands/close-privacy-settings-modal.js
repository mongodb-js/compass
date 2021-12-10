const Selectors = require('../selectors');

module.exports = function (app, page, commands) {
  return async function closePrivacySettingsModal() {
    if (!(await commands.existsEventually(Selectors.PrivacySettingsModal))) {
      console.log('privacy settings modal never became visible');
      return;
    }

    const privateSettingsModal = page.locator(
      Selectors.PrivacySettingsModal
    );

    await privateSettingsModal.waitFor();
    await page.click(Selectors.ClosePrivacySettingsButton);
    await privateSettingsModal.waitFor({
      state: 'hidden'
    });
  };
};
