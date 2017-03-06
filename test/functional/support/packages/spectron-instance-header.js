const selector = require('../spectron-selector');


function addGetInstanceHeaderCommands(client) {
  /**
   * Get the instance address from the header.
   */
  client.addCommand('getInstanceHeaderDetails', function() {
    return this.getText(selector('instance-header-details'));
  });

  /**
  * Get the instance version from header.
  */
  client.addCommand('getInstanceHeaderVersion', function() {
    return this.getText(selector('instance-header-version'));
  });
}


/**
 * Add commands to the client related to the Document Validation Tab.
 *
 * @param {Client} client - The client.
 */
function addInstanceHeaderCommands(client) {
  addGetInstanceHeaderCommands(client);
}


module.exports = addInstanceHeaderCommands;
