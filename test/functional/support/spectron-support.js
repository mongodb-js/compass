const semver = require('semver');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const assert = require('assert');
const path = require('path');
const electronPrebuilt = require('electron-prebuilt');
const { selector } = require('./spectron-util');
const addCollectionCommands = require('./packages/spectron-collection');
const addCollectionDDLCommands = require('./packages/spectron-collection-ddl');
const addConnectCommands = require('./packages/spectron-connect');
const addCRUDCommands = require('./packages/spectron-crud');
const addDatabaseCommands = require('./packages/spectron-database');
const addDatabaseDDLCommands = require('./packages/spectron-database-ddl');
const addExplainCommands = require('./packages/spectron-explain');
const addHomeCommands = require('./packages/spectron-home');
const addKeyPressCommands = require('./packages/spectron-keypress');
const addIndexesCommands = require('./packages/spectron-indexes');
const addInstanceHeaderCommands = require('./packages/spectron-instance-header');
const addPerformanceCommands = require('./packages/spectron-performance');
const addPrivacyCommands = require('./packages/spectron-privacy');
const addQueryCommands = require('./packages/spectron-query');
const addSchemaCommands = require('./packages/spectron-schema');
const addSidebarCommands = require('./packages/spectron-sidebar');
const addValidationCommands = require('./packages/spectron-validation');
const Application = require('spectron').Application;
const debug = require('debug')('mongodb-compass:spectron-support');

chai.use(chaiAsPromised);

/**
 * The default timeout for selectors.
 */
const TIMEOUT = 15000;

/**
 * A long running operation timeout.
 */
const LONG_TIMEOUT = 30000;

/**
 * The wait for timeout error.
 */
const WAIT_FOR_TIMEOUT = 'WaitForTimeoutError';

/**
 * The wait until timeout error.
 */
const WAIT_UNTIL_TIMEOUT = 'WaitUntilTimeoutError';

/**
 * The progressive timeouts when searching for elements.
 */
const TIMEOUTS = [
  1000,
  2000,
  3000,
  5000,
  8000,
  13000
];

/**
 * Determine if the error is a timeout error.
 *
 * @param {Error} e - The error.
 *
 * @returns {Boolean} If the error is a timeout error.
 */
function isTimeoutError(e) {
  return e.type === WAIT_FOR_TIMEOUT || e.type === WAIT_UNTIL_TIMEOUT;
}

/**
 * Waits for an element on the page in progressive increments, using
 * fibonacci.
 *
 * @param {Function} fn - The function to use for waiting.
 * @param {String} selector - The selector for the element.
 * @param {Boolean} reverse - Whether to revers the conditions.
 * @param {Number} index - The timeout index to use from TIMEOUTS.
 */
function progressiveWait(fn, selector, reverse, index) {
  const timeout = TIMEOUTS[index];
  debug(`Looking for element ${selector} with timeout ${timeout}ms`);
  return fn(selector, timeout, reverse)
    .catch(function(e) {
      if (isTimeoutError(e) && timeout !== 13000) {
        return progressiveWait(fn, selector, reverse || false, index + 1);
      } else {
        throw e;
      }
    });
}

/**
 * Waits until the provided funciton returns true.
 *
 * @param {Function} waitUntil - The waitUntil function.
 * @param {Function} fn - The function to execute.
 * @param {Number} index - The timeout index.
 */
function progressiveWaitUntil(waitUntil, fn, index) {
  const timeout = TIMEOUTS[index];
  debug(`Waiting until function returns with timeout ${timeout}ms`);
  return waitUntil(fn, timeout)
    .catch(function(e) {
      if (isTimeoutError(e) && timeout !== 13000) {
        return progressiveWaitUntil(waitUntil, fn, index + 1);
      } else {
        throw e;
      }
    });
}

/**
 * Add the extended wait commands for Compass.
 */
function addExtendedWaitCommands(client) {

  /**
   * Wait for an element to exist in the Compass test suite.
   *
   * @param {String} selector - The CSS selector for the element.
   * @param {Boolean} reverse - Whether to reverse the wait.
   */
  client.addCommand('waitForExistInCompass', function(selector, reverse) {
    return progressiveWait(this.waitForExist.bind(this), selector, reverse, 0);
  });

  /**
   * Wait for an element to be visible in the Compass test suite.
   *
   * @param {String} selector - The CSS selector for the element.
   * @param {Boolean} reverse - Whether to reverse the wait.
   */
  client.addCommand('waitForVisibleInCompass', function(selector, reverse) {
    return progressiveWait(this.waitForVisible.bind(this), selector, reverse, 0);
  });

  /**
   * Wait for a condition to return true.
   *
   * @param {Function} fn - The function to execute.
   */
  client.addCommand('waitUntilInCompass', function(fn) {
    return progressiveWaitUntil(this.waitUntil.bind(this), fn, 0);
  });
}

/**
 * Add commands to the client that wait for common items in the
 * application to be visible.
 *
 * @param {Client} client - The client.
 */
function addWaitCommands(client) {

  /**
   * Wait for the feature tour modal to open.
   */
  client.addCommand('waitForFeatureTourModal', function() {
    return this.waitForVisibleInCompass(selector('feature-tour-modal'));
  });

  /**
   * Waits for the status bar to finish its progress and unlock the page.
   */
  client.addCommand('waitForStatusBar', function() {
    return this.waitForVisibleInCompass(selector('status-bar'), true);
  });

  /**
   * Wait for a modal error message to appear.
   */
  client.addCommand('waitForModalError', function() {
    return this.waitForVisibleInCompass(selector('modal-message'));
  });
}

/**
 * Add commands to the client for clicking links and buttons in the application.
 *
 * @param {Client} client - The client.
 */
function addClickCommands(client) {
  /**
   * Click the close feature tour modal button.
   */
  client.addCommand('clickCloseFeatureTourButton', function() {
    return this.click(selector('close-tour-button'));
  });

}

/**
 * Add commands to the client to get values from the screen.
 *
 * @param {Client} client - The client.
 */
function addGetCommands(client) {
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
 * Create the spectron application.
 *
 * @returns {Application} The spectron application.
 */
function createApplication() {
  const dir = path.join(__dirname, '..', '..', '..');
  /* Force the node env to testing */
  process.env.NODE_ENV = 'testing';
  return new Application({
    path: electronPrebuilt,
    args: [ dir ],
    env: process.env,
    cwd: dir
  });
}

/**
 * Call launchCompass in beforeEach for all UI tests:
 *
 * @returns {Promise} Promise that resolves when app starts.
 */
function launchCompass() {
  const app = createApplication();
  return app.start().then(() => {
    const client = app.client;
    addExtendedWaitCommands(client);
    addWaitCommands(client);
    addClickCommands(client);
    addGetCommands(client);
    addCollectionCommands(client);
    addCollectionDDLCommands(client);
    addConnectCommands(client);
    addCRUDCommands(client);
    addDatabaseCommands(client);
    addDatabaseDDLCommands(client);
    addExplainCommands(client);
    addHomeCommands(client);
    addKeyPressCommands(client);
    addIndexesCommands(client);
    addInstanceHeaderCommands(client);
    addPerformanceCommands(client);
    addPrivacyCommands(client);
    addQueryCommands(client);
    addSchemaCommands(client);
    addSidebarCommands(client);
    addValidationCommands(client);
    chaiAsPromised.transferPromiseness = app.transferPromiseness;
    chai.should().exist(client);
    return client.waitUntilWindowLoaded(LONG_TIMEOUT);
  }).then(() => {
    return app;
  });
}

/**
 * Call quitCompass in afterEach for all UI tests:

 * @param {Object} app - The running application
 * @param {Function} done - The callback to execute when finished.
 *
 * @returns {Promise}    Promise that resolves when app stops.
 */
function quitCompass(app, done) {
  if (!app || !app.isRunning()) return;
  return app.stop().then(function() {
    assert.equal(app.isRunning(), false);
    done();
  });
}

/**
 * Determine if index usage is enabled in the server version.
 *
 * @param {String} version - The server version.
 *
 * @returns {Boolean} If index usage is available.
 */
function isIndexUsageEnabled(version) {
  return semver.gte(version, '3.2.0');
}

module.exports.launchCompass = launchCompass;
module.exports.quitCompass = quitCompass;
module.exports.isIndexUsageEnabled = isIndexUsageEnabled;
module.exports.TIMEOUT = TIMEOUT;
module.exports.LONG_TIMEOUT = LONG_TIMEOUT;
