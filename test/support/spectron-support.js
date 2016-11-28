const _ = require('lodash');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const assert = require('assert');
// const fs = require('fs');
const format = require('util').format;
const path = require('path');
const electronPrebuilt = require('electron-prebuilt');
const Application = require('spectron').Application;

chai.use(chaiAsPromised);

/**
 * Get the value for the response.
 *
 * @param {Response} response - The response.
 *
 * @returns {Object} The response value.
 */
function responseValue(response) {
  return response.value;
}

/**
 * Get the spectron application.
 *
 * @returns {Application} The spectron application.
 */
function createApplication() {
  var dir = path.join(__dirname, '..', '..');
  return new Application({ path: electronPrebuilt, args: [ dir ], env: process.env, cwd: dir });
}

/**
 * Add helper commands to the webdriverIO client in a describe block:
 *
 * @param {Application#client} client - Client to which to add the commands
 *
 * @example
 * beforeEach(function() {
 *   helpers.addCommands(this.app.client);
 * });
 *
 */
function addCommands(client) {
  /**
   * Fills out the connect form.
   */
  client.addCommand('fillOutForm', function(model) {
    var that = this;
    var sequence = Promise.resolve();

    // set static field values
    var staticFields = ['hostname', 'port', 'name'];
    _.each(staticFields, function(field) {
      if (model[field]) {
        sequence = sequence.then(function() {
          return that.setValue(format('input[name=%s]', field), model[field]);
        });
      }
    });

    // set auth field values
    if (model.authentication && model.authentication !== 'NONE') {
      sequence = sequence.then(function() {
        return that.selectByValue('select[name=authentication]', model.authentication);
      });
      var authFields = client.getFieldNames(model.authentication);
      _.each(authFields, function(field) {
        if (model[field]) {
          sequence = sequence.then(function() {
            return that.setValue(format('input[name=%s]', field), model[field]);
          });
        }
      });
    }

    if (model.ssl && model.ssl !== 'NONE') {
      sequence = sequence.then(function() {
        return that.selectByValue('select[name=ssl]', model.ssl);
      });
      var sslFields = ['ssl_ca', 'ssl_certificate', 'ssl_private_key',
        'ssl_private_key_password'];
      _.each(sslFields, function(field) {
        if (model[field]) {
          sequence = sequence.then(function() {
            return that.setValue(format('input[name=%s]', field), model[field]);
          });
        }
      });
    }
    return sequence;
  });

  /**
   * click the `Connect` button in the connect window.
   */
  client.addCommand('clickConnect', function() {
    return this.click('button[name=connect]');
  });

  /**
   * Generic function to wait for a new window by the index in the order it was created.
   */
  client.addCommand('waitForWindow', function(index, ms, interval) {
    ms = ms || 20000;
    interval = interval || 1000;
    var newWindowHandle;
    return this.windowHandle().then(responseValue).then(function(connectHandle) {
      return this.waitUntil(function() {
        return this.windowHandles().then(responseValue).then(function(handles) {
          newWindowHandle = handles[index];
          return newWindowHandle !== connectHandle;
        });
      }, ms, interval).then(function() {
        return this.windowByIndex(index);
      });
    });
  });

  /**
   * Wait for the connect window to redirect after successful connection.
   */
  client.addCommand('waitForSchemaWindow', function() {
    return this.waitForVisible('.compass-sidebar-container', 30000);
  });

  /**
   * Wait for the help dialog to open.
   */
  client.addCommand('waitForHelpDialog', function(ms, interval) {
    return this.waitForWindow(1, ms, interval)
      .waitForVisible('div.content h1.help-entry-title');
  });

  /**
   * Filter the help topics.
   */
  client.addCommand('filterHelpTopics', function(topic) {
    return this.waitForVisible('input[placeholder=filter]')
      .setValue('input[placeholder=filter]', topic);
  });

  /**
   * Click on the 'start using compass' button in the opt-in dialog and
   * wait for it to fade out.
   */
  client.addCommand('startUsingCompass', function() {
    return this.waitForVisible('button.tour-close-button')
      .click('button.tour-close-button')
      .waitForVisible('button[data-hook=start-button]')
      .click('button[data-hook=start-button]')
      .waitForVisible('button[data-hook=start-button]', true)
      .waitUntil(function() {
        return this.getText('div[data-hook=optin-container]').then(function(text) {
          return text.length === 0;
        });
      });
  });

  /**
   * Selects a collection from the schema window sidebar to analyse.
   */
  client.addCommand('selectCollection', function(name) {
    return this.waitForStatusBar()
      .waitForVisible('.compass-sidebar-item div[title="' + name + '"]', 60000)
      .click('.compass-sidebar-item div[title="' + name + '"]')
      .waitForVisible('div.schema-field-list', 60000);
  });

  /**
   * Waits for the status bar to finish it's progress and unlock the page.
   */
  client.addCommand('waitForStatusBar', function() {
    return this.waitForVisible('div#statusbar', 15000, true);
  });

  /**
   * Refines the sample by entering the provided filter in the field and clicking apply.
   */
  client.addCommand('refineSample', function(query) {
    this.addValue('input#refine_input', query);
    return this.waitForValue('input#refine_input', 15000);
  });

  /**
   * Apply the sample by clicking the apply button
   */
  client.addCommand('applySample', function() {
    this.click('button#apply_button');
    return this.waitForVisible('div.sampling-message', 15000);
  });

  /**
   * Resets the sample by clicking on the reset button.
   */
  client.addCommand('resetSample', function() {
    this.click('button#reset_button');
    return this.waitForVisible('div.sampling-message', 15000);
  });

  /**
   * Go to the tab provided
   */
  client.addCommand('gotoTab', function(tab) {
    return this.waitForStatusBar().click('li#' + tab);
  });

  /**
   * wait for a collection item in the sidebar, then click it to start
   * sampling the collection.
   * @param collectionName {String}   full namespace of the collection, e.g.
   *                                  `mongodb.fanclub`
   * @param internal {Boolean}        set this to true if the collection is
   *                                  "special", e.g. `local.startup_log`
   * @param ms {Number}               time in milliseconds until timeout
   */
  client.addCommand('sampleCollection', function(collectionName, internal, ms) {
    ms = ms || 10000;
    if (internal) {
      collectionName += ' (internal collection)';
    }
    var selector = format('.sidebar .list-group-item span[title="%s"]', collectionName);
    return this.waitForExist(selector, ms).click(selector)
      .waitForVisible('#statusbar', ms)
      .waitForVisible('#statusbar', ms, true);
  });

  client.addCommand('selectCreateIndex', function() {
    return this.click('.create-index-btn button').waitForVisible('h4.modal-title', 15000);
  });

  client.addCommand('submitCreateIndexForm', function() {
    this.click('#field-name-select-dropdown');
    return this.submitForm('.modal-body form');
  });

  // @KeyboardTsundoku wait for the error message to display
  client.addCommand('getModalErrorMessage', function() {
    this.waitForVisible('.modal-status-error-message');
    return this.getText('.modal-status-error-message');
  });

  client.addCommand('cancelCreateIndexForm', function() {
    return this.click('.create-index-confirm-buttons-cancel');
  });
}

/**
 * Call startApplication in beforeEach for all UI tests:
 *
 * @param {String} distDir - The dist directory.
 *
 * @returns {Promise} Promise that resolves when app starts.
 *
 * @example
 * beforeEach(helpers.startApplication);
 */
function startApplication(distDir) {
  var app = createApplication(distDir);
  return app.start().then(() => {
    addCommands(app.client);
    chaiAsPromised.transferPromiseness = app.transferPromiseness;
    chai.should().exist(app.client);
    return app.client.waitUntilWindowLoaded(20000);
  }).then(() => {
    return app;
  });
}

/**
 * Call stopApplication in afterEach for all UI tests:
 * @param {Object} app   the running application
 * @returns {Promise}    Promise that resolves when app stops.
 *
 * @example
 * afterEach(helpers.startApplication);
 */
function stopApplication(app) {
  if (!app || !app.isRunning()) return;
  return app.stop().then(function() {
    assert.equal(app.isRunning(), false);
  });
}

module.exports.startApplication = startApplication;
module.exports.stopApplication = stopApplication;
module.exports.addCommands = addCommands;
