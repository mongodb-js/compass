/**
 * Add workflow shortcut commands for repeatable tasks.
 *
 * @param {Client} client - The client.
 */
function addWorkflowCommands(client) {
  /**
   * Launch
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
  client.addCommand('connectToCompass', function(connection) {
    const title = `MongoDB Compass - ${connection.hostname}:${connection.port}`;
    return this
      .inputConnectionDetails(connection)
      .clickConnectButton()
      .waitForStatusBar()
      .waitForWindowTitle(title);
  });

  /**
   * Create database/collection
   */
  client.addCommand('createDatabaseCollection', function(database, collection) {
    return this
      .clickCreateDatabaseButton()
      .waitForCreateDatabaseModal()
      .inputCreateDatabaseDetails({ name: database, collectionName: collection })
      .clickCreateDatabaseModalButton()
      .waitForDatabaseCreation(database);
  });

  /**
   * Go to collection
   */
  client.addCommand('goToCollection', function(database, collection) {
    return this
      .clickDatabaseInSidebar(database)
      .waitForDatabaseView()
      .clickCollectionInSidebar(`${database}.${collection}`)
      .waitForStatusBar();
  });

  /**
   * Insert document in CRUD view
   */
  client.addCommand('insertDocument', function(doc, count) {
    return this
      .clickDocumentsTab()
      .clickInsertDocumentButton()
      .waitForInsertDocumentModal()
      .inputNewDocumentDetails(doc)
      .clickInsertDocumentModalButton()
      .waitForDocumentInsert(count);
  });

  /**
   * Tear down the test by removing the database
   * TODO: use node driver/data-service directly to delete database....
   */
  client.addCommand('teardownTest', function(database) {
    return this
      .waitForStatusBar()
      .clickInstanceHeader()
      .clickDeleteDatabaseButton(database)
      .waitForDropDatabaseModal()
      .inputDropDatabaseName(database)
      .clickDropDatabaseModalButton()
      .waitUntilDatabaseDeletion(database);
  });
}


module.exports = addWorkflowCommands;
