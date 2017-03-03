const semver = require('semver');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const assert = require('assert');
const path = require('path');
const electronPrebuilt = require('electron-prebuilt');
const { selector } = require('./spectron-util');
const addCRUDCommands = require('./packages/spectron-crud');
const addDatabaseDDLCommands = require('./packages/spectron-database-ddl');
const addExplainCommands = require('./packages/spectron-explain');
const addKeyPressCommands = require('./packages/spectron-keypress');
const addIndexesCommands = require('./packages/spectron-indexes');
const addPerformanceCommands = require('./packages/spectron-performance');
const addSchemaCommands = require('./packages/spectron-schema');
const addSidebarCommands = require('./packages/spectron-sidebar');
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
   * Wait for the connect screen to finish loading.
   */
  client.addCommand('waitForConnectView', function() {
    return this.waitForVisibleInCompass(selector('connect-form'));
  });

  /**
   * Wait for the home screen to finish loading.
   */
  client.addCommand('waitForHomeView', function() {
    // TODO: Looks like COMPASS-635, what should this selector be?
    return this.waitForVisibleInCompass(selector('instance-sidebar'));
  });

  /**
   * Wait for the feature tour modal to open.
   */
  client.addCommand('waitForFeatureTourModal', function() {
    return this.waitForVisibleInCompass(selector('feature-tour-modal'));
  });

  /**
   * Wait for the privacy settings modal to open.
   */
  client.addCommand('waitForPrivacySettingsModal', function() {
    return this.waitForVisibleInCompass(selector('privacy-settings-modal'));
  });

  /**
   * Waits for the status bar to finish its progress and unlock the page.
   */
  client.addCommand('waitForStatusBar', function() {
    return this.waitForVisibleInCompass(selector('status-bar'), true);
  });

  /**
   * Waits for the create collection modal to open.
   */
  client.addCommand('waitForCreateCollectionModal', function() {
    return this.waitForVisibleInCompass(selector('create-collection-modal'));
  });

  /**
   * Waits for the drop collection modal to open.
   */
  client.addCommand('waitForDropCollectionModal', function() {
    return this.waitForVisibleInCompass(selector('drop-collection-modal'));
  });

  /**
   * Wait for a modal error message to appear.
   */
  client.addCommand('waitForModalError', function() {
    return this.waitForVisibleInCompass(selector('modal-message'));
  });

  /**
   * Wait for the database screen to load.
   */
  client.addCommand('waitForDatabaseView', function() {
    return this.waitForVisibleInCompass(selector('collections-table'));
  });

  /*
   * Wait for the instance refresh to finish.
   */
  client.addCommand('waitForInstanceRefresh', function() {
    const button = selector('instance-refresh-button');
    const icon = `${button} i.fa-spin`;
    return this.waitForVisibleInCompass(icon, true);
  });

  /**
   * Wait for the collection with the provided name to be created.
   *
   * @param {String} name - The collection name.
   */
  client.addCommand('waitForCollectionCreation', function(name) {
    const base = selector('collections-table');
    const row = `${base} ${selector('sortable-table-column-0')}[title=${name}]`;
    return this.waitForExistInCompass(row);
  });

  /**
   * Wait for the collection with the provided name to be deleted.
   *
   * @param {String} name - The collection name.
   */
  client.addCommand('waitForCollectionDeletion', function(name) {
    const base = selector('collections-table');
    const row = `${base} ${selector('sortable-table-column-0')}[title=${name}]`;
    return this.waitForExistInCompass(row, true);
  });

  client.addCommand('waitForCreateCollectionModalHidden', function() {
    return this.waitForVisibleInCompass(selector('create-collection-modal'), true);
  });
}

/**
 * Add commands to the client for clicking links and buttons in the application.
 *
 * @param {Client} client - The client.
 */
function addClickCommands(client) {
  /*
   * Click the instance refresh button in the top right corner of the sidebar.
   */
  client.addCommand('clickInstanceRefreshIcon', function() {
    const button = selector('instance-refresh-button');
    return this
      .waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click the enable product feedback checkbox.
   */
  client.addCommand('clickEnableProductFeedbackCheckbox', function() {
    const checkbox = selector('product-feedback-checkbox');
    return this.waitForVisibleInCompass(checkbox).click(checkbox);
  });

  /**
   * Click the enable geo viz checkbox.
   */
  client.addCommand('clickEnableGeoCheckbox', function() {
    const checkbox = selector('enable-maps-checkbox');
    return this.waitForVisibleInCompass(checkbox).click(checkbox);
  });

  /**
   * Click the enable crash reports checkbox.
   */
  client.addCommand('clickEnableCrashReportsCheckbox', function() {
    const checkbox = selector('track-errors-checkbox');
    return this.waitForVisibleInCompass(checkbox).click(checkbox);
  });

  /**
   * Click the enable usage stats checkbox.
   */
  client.addCommand('clickEnableUsageStatsCheckbox', function() {
    const checkbox = selector('usage-stats-checkbox');
    return this.waitForVisibleInCompass(checkbox).click(checkbox);
  });

  /**
   * Click the enable auto updates checkbox.
   */
  client.addCommand('clickEnableAutoUpdatesCheckbox', function() {
    const checkbox = selector('auto-updates-checkbox');
    return this.waitForVisibleInCompass(checkbox).click(checkbox);
  });

  /**
   * Click the LAST delete collection trash icon in the list.
   *
   * @param {String} name - The name of the collection to delete.
   */
  client.addCommand('clickDeleteCollectionButton', function(name) {
    const base = selector('collections-table');
    const wrapper = selector('sortable-table-delete');
    const button = `${base} ${wrapper}[title='Delete ${name}']`;
    return this.waitForVisibleInCompass(base).click(button);
  });

  /**
   * click the Connect button on the connect screen.
   */
  client.addCommand('clickConnectButton', function() {
    return this.click(selector('connect-button'));
  });

  /**
   * Click the close feature tour modal button.
   */
  client.addCommand('clickCloseFeatureTourButton', function() {
    return this.click(selector('close-tour-button'));
  });

  /**
   * Click the close private settings modal button.
   */
  client.addCommand('clickClosePrivacySettingsButton', function() {
    const base = selector('close-privacy-settings-button');
    return this
      .click(base)
      .waitForVisibleInCompass(base, true)
      .waitUntilInCompass(function() {
        return this.getText('div[data-hook=optin-container]').then(function(text) {
          return text.length === 0;
        });
      });
  });

  /**
   * Click on the databases tab.
   */
  client.addCommand('clickDatabasesTab', function() {
    return this.waitForStatusBar().click(selector('databases-tab'));
  });

  /**
   * Click on the validation tab.
   */
  client.addCommand('clickValidationTab', function() {
    return this.waitForStatusBar().click(selector('validation-tab'));
  });

  /**
   * Click the drop collection button in the modal.
   */
  client.addCommand('clickDropCollectionModalButton', function() {
    const base = selector('drop-collection-button');
    return this.click(base);
  });

  /**
   * Click the create collection button.
   */
  client.addCommand('clickCreateCollectionButton', function() {
    return this.waitForStatusBar().click(selector('open-create-collection-modal-button'));
  });

  /**
   * Click the create collection button in the modal.
   */
  client.addCommand('clickCreateCollectionModalButton', function() {
    const base = selector('create-collection-button');
    return this.click(base);
  });

  // clickNewFavoriteButton
  // clickSaveFavoriteButton
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
   * Get the instance address from the header.
   */
  client.addCommand('getInstanceHeaderDetails', function() {
    return this.getText(selector('instance-header-details'));
  });

  /**
  * Get the instance version from header.
  */
  client.addCommand('getInstanceHeaderVersion', function() {
    return this.getText(selector('instance-header-version'));
  });

  /**
   * Get the text from the modal dialog error section.
   */
  client.addCommand('getModalErrorMessage', function() {
    return this.getText('p.modal-status-error-message');
  });

  /**
   * Get a list of database names from the home view.
   */
  client.addCommand('getHomeViewDatabaseNames', function() {
    return this
      .waitForVisibleInCompass(selector('databases-table'))
      .getText(selector('sortable-table-column-0'));
  });

  /**
   * Get a list of collection names from the database view.
   */
  client.addCommand('getDatabaseViewCollectionNames', function() {
    return this
      .waitForVisibleInCompass(selector('collections-table'))
      .getText(selector('sortable-table-column-0'));
  });
}

/**
 * Add commands to the client for user input.
 *
 * @param {Client} client - The client.
 */
function addInputCommands(client) {
  /**
   * Enter the collection name to drop.
   *
   * @param {String} name - The collection name.
   */
  client.addCommand('inputDropCollectionName', function(name) {
    return this.setValue(selector('confirm-drop-collection-name'), name);
  });

  /**
   * Input the collection details for creating a collection.
   *
   * @param {Object} model - { name: 'collName' }
   */
  client.addCommand('inputCreateCollectionDetails', function(model) {
    return this.setValue('#create-collection-name', model.name);
  });

  /**
   * Clicks the Options button to expand the Query bar.
   */
  client.addCommand('clickQueryBarOptionsToggle', function() {
    const base = selector('querybar-options-toggle');
    return this.waitForVisibleInCompass(base).click(base);
  });

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
    addInputCommands(client);
    addCRUDCommands(client);
    addDatabaseDDLCommands(client);
    addExplainCommands(client);
    addKeyPressCommands(client);
    addIndexesCommands(client);
    addPerformanceCommands(client);
    addSchemaCommands(client);
    addSidebarCommands(client);
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
