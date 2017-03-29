const selector = require('../spectron-selector');


function addWaitStatusBarCommands(client) {
  /**
   * Waits for the status bar to finish its progress and unlock the page.
   */
  client.addCommand('waitForStatusBar', function() {
    return this.waitForVisibleInCompass(selector('status-bar'), true);
  });
}


/**
 * Add commands to the client related to the Status Bar modal.
 *
 * @param {Client} client - The client.
 */
function addStatusBarCommands(client) {
  addWaitStatusBarCommands(client);
}


module.exports = addStatusBarCommands;
