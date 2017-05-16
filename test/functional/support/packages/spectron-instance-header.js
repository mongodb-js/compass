const { selector } = require('hadron-spectron');


function addGetInstanceHeaderCommands(client) {
  /**
   * Get the instance address from the header.
   */
  client.addCommand('getInstanceHeaderDetails', function() {
    return this.waitForVisibleInCompass(selector('instance-header-details'))
      .getText(selector('instance-header-details'));
  });
}

function addClickInstanceHeaderCommands(client) {
  /**
   * Click on the Instance header.
   */
  client.addCommand('clickInstanceHeader', function() {
    return this.click(selector('instance-header-details'));
  });
}

/**
 * Add commands to the client related to the Instance Header.
 *
 * @param {Client} client - The client.
 */
function addInstanceHeaderCommands(client) {
  addGetInstanceHeaderCommands(client);
  addClickInstanceHeaderCommands(client);
}


module.exports = addInstanceHeaderCommands;
