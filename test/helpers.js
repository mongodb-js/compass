var _ = require('lodash');
var format = require('util').format;
var Connection = require('mongodb-connection-model');
var Application = require('spectron').Application;
var os = require('os');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var ELECTRON_PATH = {
  linux: require('../tasks/linux').ELECTRON,
  win32: require('../tasks/win32').ELECTRON,
  darwin: require('../tasks/darwin').ELECTRON
};

var debug = require('debug')('mongodb-compass:test:helpers');

function responseValue(response) {
  return response.value;
}

module.exports.responseValue = responseValue;

module.exports.warnEvergreen = function() {
  /* eslint no-console:0 */
  console.warn('Spectron acceptance tests skipped on '
   + 'evergreen until the following is resolved: '
   + 'https://jira.mongodb.org/browse/BUILD-1122');
};

module.exports.getElectronPath = function() {
  var platform = os.platform();
  var electronPath = ELECTRON_PATH[platform];
  debug('platform', platform);
  if (!electronPath) {
    throw new Error('Unknown platform: ' + platform);
  }
  return ELECTRON_PATH[platform];
};

/**
 * Call startApplication in beforeEach for all UI tests:
 * @returns {Promise}   promise that resolves when app starts
 *
 * @example
 * beforeEach(helpers.startApplication);
 *
 */
module.exports.startApplication = function() {
  debug('Starting Spectron Application');
  this.app = new Application({
    path: module.exports.getElectronPath()
  });
  var app = this.app;
  debug('this.app', this.app);
  return this.app.start()
    .then(function() {
      module.exports.addCommands(app.client);
      chaiAsPromised.transferPromiseness = app.client.transferPromiseness;
      chai.should().exist(app.client);
      return app.client.waitUntilWindowLoaded();
    });
};

/**
 * Call stopApplication in afterEach for all UI tests:
 * @returns {Promise}   promise that resolves when app stops
 *
 * @example
 * afterEach(helpers.startApplication);
 *
 */
module.exports.stopApplication = function() {
  if (this.app && this.app.isRunning()) {
    debug('Stopping Spectron Application');
    return this.app.stop();
  }
};

/**
 * add helper commands to the webdriverIO client in a describe block:
 * @param {Application#client} client    client to which to add the commands
 *
 * @example
 * beforeEach(function() {
 *   helpers.addCommands(this.app.client);
 * });
 *
 */
module.exports.addCommands = function(client) {
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
      var authFields = Connection.getFieldNames(model.authentication);
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
   * wait for the connect window to close and a schema window to open.
   */
  client.addCommand('waitForSchemaWindow', function(ms, interval) {
    ms = ms || 20000;
    interval = interval || 1000;
    var schemaWindowHandle;
    return this.windowHandle().then(responseValue).then(function(connectHandle) {
      return this.waitUntil(function() {
        return this.windowHandles().then(responseValue).then(function(handles) {
          schemaWindowHandle = handles[0];
          return schemaWindowHandle !== connectHandle;
        });
      }, ms, interval).then(function() {
        return this.windowByIndex(0);
      });
    });
  });

  /**
   * Connects to the given connection or localhost:27017 and returns
   * the schema window.
   */
  client.addCommand('gotoSchemaWindow', function(connection, ms) {
    connection = _.defaults(connection || {}, {
      hostname: 'localhost',
      port: 27017
    });

    return this
      .waitForVisible('select[name=authentication]')
      .fillOutForm(connection)
      .clickConnect()
      .waitForSchemaWindow(ms);
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
};
