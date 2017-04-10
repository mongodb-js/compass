const { selector } = require('hadron-spectron');


function addClickQueryCommands(client) {
  /**
   * Clicks the Options button to expand the Query bar.
   */
  client.addCommand('clickQueryBarOptionsToggle', function() {
    const base = selector('querybar-options-toggle');
    return this.waitForVisibleInCompass(base).click(base);
  });
}


/**
 * Add commands to the client related to the Query Bar.
 *
 * @param {Client} client - The client.
 */
function addQueryCommands(client) {
  addClickQueryCommands(client);
}


module.exports = addQueryCommands;
