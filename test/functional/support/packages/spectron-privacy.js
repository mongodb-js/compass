const selector = require('../spectron-selector');


function addWaitPrivacyCommands(client) {
  /**
   * Wait for the privacy settings modal to open.
   */
  client.addCommand('waitForPrivacySettingsModal', function() {
    return this.waitForVisibleInCompass(selector('privacy-settings-modal'));
  });
}


function addClickPrivacyCommands(client) {
  /**
   * Click the enable product feedback checkbox.
   */
  client.addCommand('clickEnableProductFeedbackCheckbox', function() {
    const checkbox = selector('product-feedback-checkbox');
    return this.waitForVisibleInCompass(checkbox).click(checkbox);
  });

  /**
   * Click the enable geo viz checkbox.
   */
  client.addCommand('clickEnableGeoCheckbox', function() {
    const checkbox = selector('enable-maps-checkbox');
    return this.waitForVisibleInCompass(checkbox).click(checkbox);
  });

  /**
   * Click the enable crash reports checkbox.
   */
  client.addCommand('clickEnableCrashReportsCheckbox', function() {
    const checkbox = selector('track-errors-checkbox');
    return this.waitForVisibleInCompass(checkbox).click(checkbox);
  });

  /**
   * Click the enable usage stats checkbox.
   */
  client.addCommand('clickEnableUsageStatsCheckbox', function() {
    const checkbox = selector('usage-stats-checkbox');
    return this.waitForVisibleInCompass(checkbox).click(checkbox);
  });

  /**
   * Click the enable auto updates checkbox.
   */
  client.addCommand('clickEnableAutoUpdatesCheckbox', function() {
    const checkbox = selector('auto-updates-checkbox');
    return this.waitForVisibleInCompass(checkbox).click(checkbox);
  });

  /**
   * Click the close private settings modal button.
   */
  client.addCommand('clickClosePrivacySettingsButton', function() {
    const base = selector('close-privacy-settings-button');
    return this
      .click(base)
      .waitForVisibleInCompass(base, true)
      .waitForVisibleInCompass('div[data-hook=optin-container]', true);
  });
}

/**
 * Add commands to the client related to the Privacy Settings modal.
 *
 * @param {Client} client - The client.
 */
function addPrivacyCommands(client) {
  addWaitPrivacyCommands(client);
  addClickPrivacyCommands(client);
}


module.exports = addPrivacyCommands;
