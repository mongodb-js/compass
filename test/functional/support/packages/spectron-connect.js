const { selector } = require('hadron-spectron');


function addWaitConnectCommands(client) {
  /**
   * Wait for the connect screen to finish loading.
   */
  client.addCommand('waitForConnectView', function() {
    return this.waitForVisibleInCompass(selector('connect-string'));
  });
}


function addGetLinkToFormViewCommands(client) {
  /**
   * Retrieves the user-facing text from the fill in connection
   * fields individually link.
   */
  client.addCommand('getLinkToFormViewText', function() {
    return this.getText(selector('form-view-link'));
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

function addClickLinkToFormViewCommands(client) {
  /**
   * click the Fill in connection fields individually
   * link on the connect screen.
   */
  client.addCommand('clickLinkToFormView', function() {
    return this.click(selector('form-view-link'));
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
  addGetLinkToFormViewCommands(client);
  addClickLinkToFormViewCommands(client);
  addClickConnectCommands(client);
  addInputConnectCommands(client);
}


module.exports = addConnectCommands;
