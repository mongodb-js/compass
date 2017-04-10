const { selector } = require('hadron-spectron');


function addWaitFeatureTourCommands(client) {
  /**
   * Wait for the feature tour modal to open.
   */
  client.addCommand('waitForFeatureTourModal', function() {
    return this.waitForVisibleInCompass(selector('feature-tour-modal'));
  });
}


function addClickFeatureTourCommands(client) {
  /**
   * Click the close feature tour modal button.
   */
  client.addCommand('clickCloseFeatureTourButton', function() {
    return this.click(selector('close-tour-button'));
  });
}


/**
 * Add commands to the client related to the Feature Tour modal.
 *
 * @param {Client} client - The client.
 */
function addFeatureTourCommands(client) {
  addWaitFeatureTourCommands(client);
  addClickFeatureTourCommands(client);
}


module.exports = addFeatureTourCommands;
