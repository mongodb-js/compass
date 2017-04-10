const { selector } = require('hadron-spectron');


function addWaitHomeCommands(client) {
  /**
   * Wait for the home screen to finish loading.
   */
  client.addCommand('waitForHomeView', function() {
    return this.waitForVisibleInCompass(selector('home-view'));
  });
}


/**
 * Add commands to the client related to the Home View.
 *
 * @param {Client} client - The client.
 */
function addHomeCommands(client) {
  addWaitHomeCommands(client);
}


module.exports = addHomeCommands;
