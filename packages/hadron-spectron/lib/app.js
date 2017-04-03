const assert = require('assert');
const fs = require('fs');
const path = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { Application } = require('spectron');
const debug = require('debug')('hadron-spectron:app');

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
 *
 * @return {Function}  return value of the `fn` function.
 */
function progressiveWait(fn, selector, reverse, index) {
  const timeout = TIMEOUTS[index];
  debug(`Looking for element ${selector} with timeout ${timeout}ms`);
  return fn(selector, timeout, reverse)
    .catch(function(e) {
      if (isTimeoutError(e) && timeout !== 13000) {
        return progressiveWait(fn, selector, reverse || false, index + 1);
      }
      throw e;
    });
}

/**
 * Add the extended wait commands for Compass.
 *
 * @param {Object} client   spectron client to add the wait commands to.
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
}

/**
 * Represents a testable hadron app with Spectron.
 */
class App {

  /**
   * Create the application given the root directory to the app.
   *
   * @param {String} root - The root directory.
   * @param {String} appRoot - The root of the electron app.
   */
  constructor(root, appRoot) {
    this.root = root;
    this.appRoot = appRoot || root;

    this.app = new Application({
      path: this.electronExecutable(),
      args: [ appRoot ],
      env: process.env,
      cwd: root
    });
  }

  /**
   * Get the path to the electron executable.
   *
   * @returns {String} - The path.
   */
  electronExecutable() {
    return path.join(this.electronPackage(), fs.readFileSync(this.electronPath(), { encoding: 'utf8' }));
  }

  /**
   * Get the path to the electron package.
   *
   * @returns {String} - The path.
   */
  electronPackage() {
    return path.join(this.root, 'node_modules', 'electron');
  }

  /**
   * Get the path to the electron path.txt
   *
   * @returns {String} - The path.
   */
  electronPath() {
    return path.join(this.electronPackage(), 'path.txt');
  }

  /**
   * Launch the application.
   *
   * @returns {Application} - The spectron application.
   */
  launch() {
    return this.app.start().then(() => {
      this.client = this.app.client;
      addExtendedWaitCommands(this.client);
      chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
      chai.should().exist(this.client);
      return this.client.waitUntilWindowLoaded(LONG_TIMEOUT);
    }).catch((error) => {
      console.log(error);
      debug(error.message);
    });
  }

  /**
   * Quit the application.
   */
  quit() {
    if (!this.app || !this.app.isRunning()) return Promise.resolve();
    return this.app.stop().then(function() {
      assert.equal(this.app.isRunning(), false);
    }).catch(function(err) {
      debug('Quitting Compass failed due to error: ', err);
    });
  }
}

module.exports = App;
module.exports.TIMEOUT = TIMEOUT;
module.exports.LONG_TIMEOUT = LONG_TIMEOUT;
