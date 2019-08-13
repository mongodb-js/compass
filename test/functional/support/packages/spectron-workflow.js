/**
 * Add workflow shortcut commands for repeatable tasks.
 *
 * @param {Client} client - The client.
 */
function addWorkflowCommands(client) {
  /**
   * Launch Compass click through
   */
  client.addCommand('initialLaunchCompass', function() {
    return this
      .waitForFeatureTourModal()
      .clickCloseFeatureTourButton()
      .waitForPrivacySettingsModal()
      .clickEnableProductFeedbackCheckbox()
      .clickEnableCrashReportsCheckbox()
      .clickEnableUsageStatsCheckbox()
      .clickEnableAutoUpdatesCheckbox()
      .clickClosePrivacySettingsButton();
  });

  /**
   * Connect to Compass
   */
  client.addCommand('connectToCompass', function() {
    return this
      .waitForConnectView()
      .cickFillInFormLink()
      .waitForStatusBar()
      .clickConnectButton()
      .waitForHomeView()
      .getDatabasesTabText().should.eventually.equal('Databases');
  });

  /**
   * Go to collection, assumes refresh is required
   */
  client.addCommand('goToCollection', function(database, collection) {
    return this
      .clickInstanceRefreshIcon()
      .waitForInstanceRefresh()
      .clickDatabaseInSidebar(database)
      .waitForSidebar('collection')
      .clickCollectionInSidebar(`${database}.${collection}`)
      .waitForStatusBar();
  });
}


module.exports = addWorkflowCommands;
