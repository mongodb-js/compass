/**
 * Add workflow shortcut commands for repeatable tasks.
 *
 * @param {Client} client - The client.
 */
function addWorkflowCommands(client) {
  /**
   * Connect to Compass
   */
  client.addCommand('connectToCompass', function(connection) {
    return this
      .inputConnectionDetails(connection)
      .clickConnectButton()
      .waitForStatusBar();
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
}


module.exports = addWorkflowCommands;
