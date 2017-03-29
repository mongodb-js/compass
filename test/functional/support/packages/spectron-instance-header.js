const selector = require('../spectron-selector');
const debug = require('debug')('mongodb-compass:spectron-support');

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

function addClickInstanceHeaderCommands(client) {
  /**
   * Click on the Instance header.
   */
  client.addCommand('clickInstanceHeader', function() {
    debug('clicking instance header');
    return this.click(selector('instance-header-details'));
  });
}

function addWaitInstanceHeaderCommands(client) {
  /**
   * Wait For instance header to exist
   */
  client.addCommand('waitForInstanceHeader', function() {
    return this.waitForExistInCompass(selector('instance-header-details'));
  });
}

/**
 * Add commands to the client related to the Document Validation Tab.
 *
 * @param {Client} client - The client.
 */
function addInstanceHeaderCommands(client) {
  addGetInstanceHeaderCommands(client);
  addClickInstanceHeaderCommands(client);
  addWaitInstanceHeaderCommands(client);
}


module.exports = addInstanceHeaderCommands;
