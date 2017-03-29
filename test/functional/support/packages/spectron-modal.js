const selector = require('../spectron-selector');


function addWaitModalCommands(client) {
  /**
   * Wait for a modal error message to appear.
   */
  client.addCommand('waitForModalError', function() {
    return this.waitForVisibleInCompass(selector('modal-message'));
  });

  client.addCommand('waitForModalHide', function() {
    return this.waitForExistInCompass('body.modal-open', true);
  });
}

function addGetModalCommands(client) {
  /**
   * Get the title of the standard Compass modal dialog.
   */
  client.addCommand('getModalTitle', function() {
    return this.getText(selector('modal-title'));
  });

  /**
   * Get the text from the modal dialog error section.
   */
  client.addCommand('getModalErrorMessage', function() {
    return this.getText('p.modal-status-error-message');
  });
}


/**
 * Add commands to the client related to the generalised Compass modal.
 *
 * @param {Client} client - The client.
 */
function addModalCommands(client) {
  addWaitModalCommands(client);
  addGetModalCommands(client);
}


module.exports = addModalCommands;
