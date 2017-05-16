const { selector } = require('hadron-spectron');


function addGetServerVersionCommands(client) {
  /**
   * Get the server version from header.
   */
  client.addCommand('getServerVersion', function() {
    return this.getText(selector('server-version'));
  });
}

/**
 * Add commands to the client related to the Server Version component.
 *
 * @param {Client} client - The client.
 */
function addServerVersionCommands(client) {
  addGetServerVersionCommands(client);
}


module.exports = addServerVersionCommands;
