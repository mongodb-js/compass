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
  8000
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
      if (isTimeoutError(e) && timeout !== 8000) {
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

  /**
   * Waits until the currently selected window is visible to the user.
   *
   * @param {Number} timeout - The amount of time to wait.
   */
  client.addCommand('waitUntilWindowVisibleInCompass', function(timeout) {
    return this.waitUntil(function() {
      debug('Waiting for window to become visible');
      return this.browserWindow.isVisible().then(function(visible) {
        return visible;
      });
    }, timeout).then(function() {}, function(error) {
      error.message = `waitUntilWindowVisibleInCompass ${error.message}`;
      throw error;
    });
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
    this.appRoot = (appRoot === undefined) ? root : appRoot;

    this.app = new Application({
      path: this.electronExecutable(),
      args: [ this.appRoot ],
      env: process.env,
      cwd: this.root
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
   * @param {Function} addCustomCommands - A function to add custom commands.
   *
   * @returns {Application} - The spectron application.
   */
  launch(addCustomCommands) {
    return this.app.start().then(() => {
      chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
      this.client = this.app.client;
      addExtendedWaitCommands(this.client);
      if (addCustomCommands !== undefined) {
        addCustomCommands(this.client);
      }
      chai.should().exist(this.client);
      // The complexity here is to be able to handle applications that have a
      // standard 1 window setup and those with 2 where the first is a loading
      // window to animated while the other is loading. In order for us to
      // figure this out, we first get the window handles.
      return this.client.windowHandles();
    }).then((session) => {
      // If the window handles have a 2nd window, we know we are in a loading
      // window situation, and that the content we are actually interested in is
      // in the 2nd window, which is currently hidden.
      if (session.value[1]) {
        return this.client.windowByIndex(1);
      }
      return this.client.windowByIndex(0);
    }).then(() => {
      // Now we wait for our focused window to become visible to the user. In the
      // case of a single window this is already the case. In the case of a loading
      // window this will wait until the main content window is ready.
      return this.client.waitUntilWindowVisibleInCompass(LONG_TIMEOUT);
    }).then(() => {
      // Once we ensure the window is visible, we ensure all the content has loaded.
      // This is the same for both setups.
      return this.client.waitUntilWindowLoaded(LONG_TIMEOUT);
    }).then(() => {
      return this;
    }).catch((error) => {
      debug(error.message);
    });
  }

  /**
   * Quit the application.
   */
  quit() {
    if (!this.app || !this.app.isRunning()) return Promise.resolve();
    return this.app.stop().then(() => {
      assert.equal(this.app.isRunning(), false);
    }).catch((err) => {
      debug('Quitting Compass failed due to error: ', err);
    });
  }
}

module.exports = App;
module.exports.TIMEOUT = TIMEOUT;
module.exports.LONG_TIMEOUT = LONG_TIMEOUT;
