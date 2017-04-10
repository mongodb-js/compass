const { selector } = require('hadron-spectron');


function addWaitDatabaseCommands(client) {
  /**
   * Wait for the database screen to load.
   */
  client.addCommand('waitForDatabaseView', function() {
    return this.waitForVisibleInCompass(selector('collections-table'));
  });
}


function addClickDatabaseCommands(client) {
  /**
   * Click on the databases tab.
   */
  client.addCommand('clickDatabasesTab', function() {
    return this.waitForStatusBar().click(selector('databases-tab'));
  });
}


function addGetDatabaseCommands(client) {
  /**
   * Get a list of database names from the Databases Tab.
   */
  client.addCommand('getDatabasesTabDatabaseNames', function() {
    return this
      .waitForVisibleInCompass(selector('databases-table'))
      .getText(selector('sortable-table-column-0'));
  });
}


/**
 * Add commands to the client related to the Databases Tab.
 *
 * @param {Client} client - The client.
 */
function addDatabaseCommands(client) {
  addWaitDatabaseCommands(client);
  addClickDatabaseCommands(client);
  addGetDatabaseCommands(client);
}


module.exports = addDatabaseCommands;
