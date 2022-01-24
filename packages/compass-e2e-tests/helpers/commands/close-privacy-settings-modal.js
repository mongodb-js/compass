const Selectors = require('../selectors');

module.exports = function (compass) {
  return async function closePrivacySettingsModal() {
    const { browser } = compass;

    if (!(await browser.existsEventually(Selectors.PrivacySettingsModal))) {
      return;
    }

    const privateSettingsModalElement = await browser.$(
      Selectors.PrivacySettingsModal
    );

    await privateSettingsModalElement.waitForDisplayed();
    await browser.clickVisible(Selectors.ClosePrivacySettingsButton);
    await privateSettingsModalElement.waitForDisplayed({
      reverse: true,
    });
  };
};
