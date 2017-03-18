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
   * Create database/collections
   */
  client.addCommand('createDatabaseCollection', function(database, collection) {
    return this
      .clickCreateDatabaseButton()
      .waitForCreateDatabaseModal()
      .inputCreateDatabaseDetails({ name: database, collectionName: collection })
      .clickCreateDatabaseModalButton()
      .waitForDatabaseCreation(database);
  });
}


module.exports = addWorkflowCommands;
