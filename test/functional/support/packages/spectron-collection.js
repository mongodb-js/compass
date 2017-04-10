const { selector } = require('hadron-spectron');


function addGetCollectionCommands(client) {
  /**
   * Get a list of collection names from the Collections Tab.
   */
  client.addCommand('getCollectionsTabCollectionNames', function() {
    return this
      .waitForVisibleInCompass(selector('collections-table'))
      .getText(selector('sortable-table-column-0'));
  });
}


/**
 * Add commands to the client related to the Collections Tab.
 *
 * @param {Client} client - The client.
 */
function addCollectionCommands(client) {
  addGetCollectionCommands(client);
}


module.exports = addCollectionCommands;
