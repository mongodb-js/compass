const selector = require('../spectron-selector');


function addWaitHomeViewCommands(client) {
  /**
   * Wait for the home screen to finish loading.
   */
  client.addCommand('waitForHomeView', function() {
    // TODO: Looks like COMPASS-635, what should this selector be?
    return this.waitForVisibleInCompass(selector('instance-sidebar'));
  });
}


/**
 * Add commands to the client related to the Home View.
 *
 * @param {Client} client - The client.
 */
function addHomeViewCommands(client) {
  addWaitHomeViewCommands(client);
}


module.exports = addHomeViewCommands;
