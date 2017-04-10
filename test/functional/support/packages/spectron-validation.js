const { selector } = require('hadron-spectron');


function addClickValidationCommands(client) {
  /**
   * Click on the validation tab.
   */
  client.addCommand('clickValidationTab', function() {
    return this.waitForStatusBar().click(selector('validation-tab'));
  });
}


/**
 * Add commands to the client related to the Document Validation Tab.
 *
 * @param {Client} client - The client.
 */
function addValidationCommands(client) {
  addClickValidationCommands(client);
}


module.exports = addValidationCommands;
