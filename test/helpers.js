process.env.NODE_ENV = 'testing';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var format = require('util').format;
var Application = require('spectron').Application;
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

chai.use(chaiAsPromised);

var Connection = require('mongodb-connection-model');

/**
 * Test documents to sample with a local server.
 */
var DOCUMENTS = [
  {
    'name': 'Aphex Twin'
  },
  {
    'name': 'Bonobo'
  },
  {
    'name': 'Arca'
  },
  {
    'name': 'Beacon'
  }
];

var ELECTRON_PREBUILT_EXECUTABLE = require('electron-prebuilt');
var DIST = path.resolve(__dirname, '..', 'dist');
var ELECTRON_EXECUTABLE_BY_PLATFORM = {
  linux: path.join(DIST, 'mongodb-compass-linux-x64', 'mongodb-compass'),
  win32: path.join(DIST, 'MongoDBCompass-win32-x64', 'MongoDBCompass.exe'),
  darwin: path.join(DIST, 'MongoDB Compass-darwin-x64', 'MongoDB Compass.app',
    'Contents', 'MacOS', 'Electron')
};

var debug = require('debug')('mongodb-compass:test:helpers');

function responseValue(response) {
  return response.value;
}

module.exports.responseValue = responseValue;

module.exports.getApplication = function() {
  if (process.env.TEST_WITH_PREBUILT) {
    debug('Starting application with spectron using electron-prebuilt `%s`',
      ELECTRON_PREBUILT_EXECUTABLE);

    return new Application({
      path: ELECTRON_PREBUILT_EXECUTABLE,
      args: [ path.join(__dirname, '..') ],
      env: process.env,
      cwd: path.join(__dirname, '..')
    });
  }
  var ELECTRON_EXECUTABLE = ELECTRON_EXECUTABLE_BY_PLATFORM[process.platform];

  debug('Starting application with spectron using Release executable `%s`',
    ELECTRON_EXECUTABLE);

  /* eslint no-sync:0 */
  assert(fs.existsSync(ELECTRON_EXECUTABLE),
    'Release executable not found!  Did you run `npm run prepublish`?');
  return new Application({
    path: ELECTRON_EXECUTABLE,
    env: process.env
  });
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
  var app = this.app = module.exports.getApplication();
  return this.app.start()
    .then(function() {
      module.exports.addCommands(app.client);
      chaiAsPromised.transferPromiseness = app.client.transferPromiseness;
      chai.should().exist(app.client);
      return app.client.waitUntilWindowLoaded(20000);
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
 * Insert the test documents into the compass-test.bands collection.
 */
module.exports.insertTestDocuments = function(done) {
  MongoClient.connect('mongodb://localhost:27018/compass-test', function(err, db) {
    assert.equal(null, err);
    var collection = db.collection('bands');
    collection.insertMany(DOCUMENTS, function(error, result) {
      assert.equal(null, error);
      debug(result);
      db.close();
      done();
    });
  });
};

/**
 * Remove all the test documents.
 */
module.exports.removeTestDocuments = function(done) {
  MongoClient.connect('mongodb://localhost:27018/compass-test', function(err, db) {
    assert.equal(null, err);
    var collection = db.collection('bands');
    collection.deleteMany({}, {}, function(error, result) {
      assert.equal(null, error);
      debug(result);
      db.close();
      done();
    });
  });
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
   * Wait for the connect window to close and a schema window to open.
   */
  client.addCommand('waitForSchemaWindow', function(ms, interval) {
    return this.waitForWindow(0, ms, interval);
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
    return this.waitForVisible('button[data-hook=start-button]')
      .click('button[data-hook=start-button]')
      .waitForVisible('button[data-hook=start-button]', true)
      .waitUntil(function() {
        return this.getText('div[data-hook=optin-container]').then(function(text) {
          return text.length === 0;
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
   * Selects a collection from the schema window sidebar to analyse.
   */
  client.addCommand('selectCollection', function(name) {
    return this.waitForStatusBar()
      .waitForVisible('a span[title="' + name + '"]')
      .click('a span[title="' + name + '"]')
      .waitForVisible('div.schema-field-list');
  });

  /**
   * Waits for the status bar to finish it's progress and unlock the page.
   */
  client.addCommand('waitForStatusBar', function() {
    return this.waitForVisible('div#statusbar', 15000, true);
  });

  /**
   * Opens the sample documents in the right panel.
   */
  client.addCommand('viewSampleDocuments', function() {
    return this.waitForStatusBar()
      .click('#view_sample')
      .waitForVisible('div#sample_documents');
  });

  /**
   * Refines the sample by entering the provided filter in the field and clicking apply.
   */
  client.addCommand('refineSample', function(query) {
    return this.waitForStatusBar()
      .setValue('input#refine_input', query)
      .click('button#apply_button');
  });

  /**
   * Resets the sample by clicking on the reset button.
   */
  client.addCommand('resetSample', function() {
    return this.waitForStatusBar()
      .click('button#reset_button');
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
