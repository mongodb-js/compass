const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { Application } = require('spectron');
const fs = require('fs');
const path = require('path');
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
const TIMEOUTS = [1000, 2000, 3000, 5000, 8000];

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
  return fn(selector, timeout, reverse).catch(function(e) {
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
    return progressiveWait(
      this.waitForVisible.bind(this),
      selector,
      reverse,
      0
    );
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
    }, timeout).then(
      function() {},
      function(error) {
        error.message = `waitUntilWindowVisibleInCompass ${error.message}`;
        throw error;
      }
    );
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
    this.appRoot = appRoot === undefined ? root : appRoot;

    const opts = {
      path: this.electronExecutable(),
      args: [this.appRoot],
      cwd: this.root

      /**
       * @see https://jira.mongodb.org/browse/COMPASS-3115
       * env: process.env
       */
    };

    assert(
      typeof opts.path === 'string',
      'electronExecutable must be a string'
    );

    this.app = new Application(opts);
  }

  /**
   * Get the path to the electron executable.
   *
   * NOTE (@imlucas) Tried `require('electron')` but always returned null in
   * Compass test suite for unknown reasons.
   *
   * @returns {String} - The path.
   */
  electronExecutable() {
    return path.join(
      this.electronPackage(),
      'dist',
      fs.readFileSync(this.electronPath(), { encoding: 'utf8' })
    );
  }

  /**
   * Get the path to the electron package.
   * TODO (@imlucas) Allow setting via `ELECTRON_EXECUTABLE` environment
   * variable or something if we want to allow functional testing of
   * fully packaged Compass releases instead of just using electron prebuilt.
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
    debug('launching...', { cwd: this.root });
    return this.app
      .start()
      .then(() => {
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
        debug('app started! Finding windows...');
        return this.client.windowHandles();
      })
      .then(session => {
        // If the window handles have a 2nd window, we know we are in a loading
        // window situation, and that the content we are actually interested in is
        // in the 2nd window, which is currently hidden.
        if (session.value[1]) {
          debug(
            'loading window detected. assuming real app window is behind it.'
          );
          return this.client.windowByIndex(1);
        }
        debug('no loading window detected');
        return this.client.windowByIndex(0);
      })
      .then(() => {
        // Now we wait for our focused window to become visible to the user. In the
        // case of a single window this is already the case. In the case of a loading
        // window this will wait until the main content window is ready.
        debug(
          'Waiting up to %dms for focused window to become visible to the user...',
          LONG_TIMEOUT
        );
        return this.client.waitUntilWindowVisibleInCompass(LONG_TIMEOUT);
      })
      .then(() => {
        // Once we ensure the window is visible, we ensure all the content has loaded.
        // This is the same for both setups.
        debug('Waiting up to %dms for focused window to load...', LONG_TIMEOUT);
        return this.client.waitUntilWindowLoaded(LONG_TIMEOUT);
      })
      .then(() => {
        debug('app window loaded and ready!');
        return this;
      })
      .catch(error => {
        /* eslint no-console:0 */
        console.error(
          'hadron-spectron: App failed to launch due to error:',
          error
        );
        throw error;
      });
  }

  /**
   * Quit the application.
   * @returns {Promise} - Resolves true if actually quit, false if called but no/not running `app`.
   */
  quit() {
    debug('quitting app');
    if (!this.app || !this.app.isRunning()) {
      debug('no app or app not running');
      return Promise.resolve(false);
    }
    return this.app
      .stop()
      .then(() => {
        assert.equal(this.app.isRunning(), false);
        debug('app quit. goodbye.');
        return true;
      })
      .catch(err => {
        /* eslint no-console:0 */
        console.error('hadron-spectron: App failed to quit due to error:', err);
        throw err;
      });
  }
}

module.exports = App;
module.exports.TIMEOUT = TIMEOUT;
module.exports.LONG_TIMEOUT = LONG_TIMEOUT;
