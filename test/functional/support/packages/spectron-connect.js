const selector = require('../spectron-selector');


function addWaitConnectCommands(client) {
  /**
   * Wait for the connect screen to finish loading.
   */
  client.addCommand('waitForConnectView', function() {
    return this.waitForVisibleInCompass(selector('connect-form'));
  });
}


function addGetConnectCommands(client) {
  /**
   * Retrieves the user-facing text from the connect header.
   */
  client.addCommand('getConnectHeaderText', function() {
    return this.getText(selector('connect-header'));
  });
}


function addClickConnectCommands(client) {
  /**
   * click the Connect button on the connect screen.
   */
  client.addCommand('clickConnectButton', function() {
    return this.click(selector('connect-button'));
  });
}


function addInputConnectCommands(client) {
  /**
   * Input connection details on the connection screen.
   *
   * @param {Object} model - The connection model.
   */
  client.addCommand('inputConnectionDetails', function(model) {
    const that = this;
    let sequence = Promise.resolve();

    const staticFields = [ 'hostname', 'port', 'name' ];
    staticFields.forEach(function(field) {
      if (model[field]) {
        sequence = sequence.then(function() {
          return that.setValue(`input[name=${field}]`, model[field]);
        });
      }
    });

    if (model.authentication && model.authentication !== 'NONE') {
      sequence = sequence.then(function() {
        return that.selectByValue('select[name=authentication]', model.authentication);
      });
      const authFields = client.getFieldNames(model.authentication);
      authFields.forEach(function(field) {
        if (model[field]) {
          sequence = sequence.then(function() {
            return that.setValue(`input[name=${field}]`, model[field]);
          });
        }
      });
    }

    if (model.ssl && model.ssl !== 'NONE') {
      sequence = sequence.then(function() {
        return that.selectByValue('select[name=ssl]', model.ssl);
      });
      const sslFields = ['ssl_ca', 'ssl_certificate', 'ssl_private_key',
        'ssl_private_key_password'];
      sslFields.forEach(function(field) {
        if (model[field]) {
          sequence = sequence.then(function() {
            return that.setValue(`input[name=${field}]`, model[field]);
          });
        }
      });
    }
    return sequence;
  });
}

/**
 * Add commands to the client related to the Document Validation Tab.
 *
 * @param {Client} client - The client.
 */
function addConnectCommands(client) {
  addWaitConnectCommands(client);
  addGetConnectCommands(client);
  addClickConnectCommands(client);
  addInputConnectCommands(client);
}


module.exports = addConnectCommands;
