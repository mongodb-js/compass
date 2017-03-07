const _ = require('lodash');
const semver = require('semver');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const assert = require('assert');
const format = require('util').format;
const path = require('path');
const electronPrebuilt = require('electron-prebuilt');
const Application = require('spectron').Application;
const debug = require('debug')('mongodb-compass:spectron-support');

chai.use(chaiAsPromised);

/**
 * The idetifier for testable elements.
 */
const TEST_ID = 'data-test-id';

/**
 * The default timeout for selectors.
 */
const TIMEOUT = 15000;

/**
 * A long running operation timeout.
 */
const LONG_TIMEOUT = 30000;

/**
 * Get the selector for a standard unique identifier.
 *
 * @param {String} id - The id.
 *
 * @returns {String} The CSS selector.
 */
function selector(id) {
  return `[${TEST_ID}='${id}']`;
}

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
   * Wait for document deletion to finish.
   *
   * @param {Number} index - The index of the document being deleted.
   */
  client.addCommand('waitForDocumentDeletionToComplete', function(index) {
    const base = `${selector('document-list-item')}:nth-child(${index})`;
    return this.waitForExistInCompass(base, true);
  });

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
   * Waits for the create index modal to open.
   */
  client.addCommand('waitForCreateIndexModal', function() {
    return this.waitForVisibleInCompass(selector('create-index-modal'));
  });

  client.addCommand('waitForSidebar', function(type) {
    return this.waitForVisibleInCompass(selector('sidebar-' + type));
  });
  /**
   * Waits for the create database modal to open.
   */
  client.addCommand('waitForCreateDatabaseModal', function() {
    return this.waitForVisibleInCompass(selector('create-database-modal'));
  });

  /**
   * Waits for the create collection modal to open.
   */
  client.addCommand('waitForCreateCollectionModal', function() {
    return this.waitForVisibleInCompass(selector('create-collection-modal'));
  });

  /**
   * Waits for the drop database modal to open.
   */
  client.addCommand('waitForDropDatabaseModal', function() {
    return this.waitForVisibleInCompass(selector('drop-database-modal'));
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

  /**
   * Wait for the insert document modal to open.
   */
  client.addCommand('waitForInsertDocumentModal', function() {
    return this.waitForVisibleInCompass(selector('insert-document-modal'));
  });

  /**
   * Wait for a document to be inserted at the index.
   *
   * @param {Number} index - The document index.
   */
  client.addCommand('waitForDocumentInsert', function(index) {
    const base = selector('document-list-item');
    return this.waitForExistInCompass(`${base}:nth-child(${index})`);
  });

  /**
   * Wait for the edit document to complete.
   *
   * @param {Number} index - The index of the document in the list.
   */
  client.addCommand('waitForDocumentUpdate', function(index) {
    const base = selector('document-list-item');
    const message = `${base}:nth-child(${index}) ${selector('document-message')}`;
    return this.waitForExistInCompass(message, true);
  });

  /**
   * Wait for the index with the provided name to be created.
   *
   * @param {String} name - The index name.
   */
  client.addCommand('waitForIndexCreation', function(name) {
    return this
      .waitForStatusBar()
      .waitUntilInCompass(function() {
        return this.getIndexNames().then(function(names) {
          return names.includes(name);
        });
      });
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
   * Wait for the database with the provided name to be created.
   *
   * @param {String} name - The database name.
   */
  client.addCommand('waitForDatabaseCreation', function(name) {
    const base = selector('databases-table');
    const row = `${base} ${selector('sortable-table-column-0')}[title=${name}]`;
    return this.waitForExistInCompass(row);
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
   * Wait for the database with the provided name to be deleted.
   *
   * @param {String} name - The database name.
   */
  client.addCommand('waitForDatabaseDeletion', function(name) {
    const base = selector('databases-table');
    const row = `${base} ${selector('sortable-table-column-0')}[title=${name}]`;
    return this.waitForExistInCompass(row, true);
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

  client.addCommand('waitForCreateDatabasesModalHidden', function() {
    return this.waitForVisibleInCompass(selector('create-database-modal'), true);
  });

  client.addCommand('waitForDropDatabasesModalHidden', function() {
    return this.waitForVisibleInCompass(selector('drop-database-modal'), true);
  });

  client.addCommand('waitForCreateCollectionModalHidden', function() {
    return this.waitForVisibleInCompass(selector('create-collection-modal'), true);
  });

  client.addCommand('waitForInsertDocumentModalHidden', function() {
    return this.waitForVisibleInCompass(selector('insert-document-modal'), true);
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
   * Click the refresh documents button.
   */
  client.addCommand('clickRefreshDocumentsButton', function() {
    const button = selector('refresh-documents-button');
    return this.waitForVisibleInCompass(button).click(button);
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
   * click the pause button the performance tab.
   */
  client.addCommand('clickPerformancePauseButton', function() {
    const button = selector('performance-pause');
    return this.waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click the LAST delete database trash icon in the list.
   *
   * @param {String} name - The name of the database to delete.
   */
  client.addCommand('clickDeleteDatabaseButton', function(name) {
    const base = selector('databases-table');
    const wrapper = selector('sortable-table-delete');
    const button = `${base} ${wrapper}[title='Delete ${name}']`;
    return this.waitForVisibleInCompass(base).click(button);
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
   * toggle the sidebar
   */
  client.addCommand('clickToggleInSidebar', function() {
    const base = selector('toggle-sidebar');
    return this.waitForVisibleInCompass(base).click(base);
  });

  /**
   * Click on a collection in the sidebar.
   *
   * @param {String} name - The full collection name.
   */
  client.addCommand('clickCollectionInSidebar', function(name) {
    const base = `${selector('sidebar-collection')}[title='${name}']`;
    return this.waitForVisibleInCompass(base).click(base);
  });

  /**
   * Click on a database in the sidebar.
   *
   * @param {String} name - The database name.
   */
  client.addCommand('clickDatabaseInSidebar', function(name) {
    const base = `${selector('sidebar-database')}[title='${name}']`;
    return this.waitForVisibleInCompass(base).click(base);
  });

  /**
   * Click the apply filter button from the documents tab.
   */
  client.addCommand('clickApplyFilterButtonFromDocumentsTab', function() {
    const base = selector('documents-content');
    const button = `${base} ${selector('apply-filter-button')}`;
    return this.waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click the reset filter button from the documents tab.
   */
  client.addCommand('clickResetFilterButtonFromDocumentsTab', function() {
    const base = selector('documents-content');
    const button = `${base} ${selector('reset-filter-button')}`;
    return this.waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click the apply filter button from the schema tab.
   */
  client.addCommand('clickApplyFilterButtonFromSchemaTab', function() {
    const base = selector('schema-content');
    const button = `${base} ${selector('apply-filter-button')}`;
    return this.waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click the reset filter button from the schema tab.
   */
  client.addCommand('clickResetFilterButtonFromSchemaTab', function() {
    const base = selector('schema-content');
    const button = `${base} ${selector('reset-filter-button')}`;
    return this.waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click the apply filter button from the explain plan tab.
   */
  client.addCommand('clickApplyFilterButtonFromExplainPlanTab', function() {
    const base = selector('explain-plan-content');
    const button = `${base} ${selector('apply-filter-button')}`;
    return this.waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click the reset filter button from the explain plan tab.
   */
  client.addCommand('clickResetFilterButtonFromExplainPlanTab', function() {
    const base = selector('explain-plan-content');
    const button = `${base} ${selector('reset-filter-button')}`;
    return this.waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click on the databases tab.
   */
  client.addCommand('clickDatabasesTab', function() {
    return this.waitForStatusBar().click(selector('databases-tab'));
  });

  /**
   * Click on the performance tab.
   */
  client.addCommand('clickPerformanceTab', function() {
    return this.waitForStatusBar().click(selector('performance-tab'));
  });

  /**
   * Click on the schema tab.
   */
  client.addCommand('clickSchemaTab', function() {
    return this.waitForStatusBar().click(selector('schema-tab'));
  });

  /**
   * Click on the documents tab.
   */
  client.addCommand('clickDocumentsTab', function() {
    return this.waitForStatusBar().click(selector('documents-tab'));
  });

  /**
   * Click on the explain plan tab.
   */
  client.addCommand('clickExplainPlanTab', function() {
    return this.waitForStatusBar().click(selector('explain-plan-tab'));
  });

  /**
   * Click on the indexes tab.
   */
  client.addCommand('clickIndexesTab', function() {
    return this.waitForStatusBar().click(selector('indexes-tab'));
  });

  /**
   * Click on the validation tab.
   */
  client.addCommand('clickValidationTab', function() {
    return this.waitForStatusBar().click(selector('validation-tab'));
  });

  /**
   * Click the create index button.
   */
  client.addCommand('clickCreateIndexButton', function() {
    const button = selector('open-create-index-modal-button');
    return this.waitForStatusBar()
      .waitForVisibleInCompass(button)
      .click(button);
  });

  /**
   * Click the create database button.
   */
  client.addCommand('clickCreateDatabaseButton', function() {
    return this.waitForStatusBar().click(selector('open-create-database-modal-button'));
  });

  /**
   * Click the create index button in the modal.
   */
  client.addCommand('clickCreateIndexModalButton', function() {
    const form = selector('create-index-modal');
    return this.submitForm(`${form} form`);
  });

  /**
   * Click the create database button in the modal.
   */
  client.addCommand('clickCreateDatabaseModalButton', function() {
    const base = selector('create-database-button');
    return this.click(base);
  });

  /**
   * Click the drop database button in the modal.
   */
  client.addCommand('clickDropDatabaseModalButton', function() {
    const base = selector('drop-database-button');
    return this.click(base);
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

  /**
   * Click the insert document button.
   */
  client.addCommand('clickInsertDocumentButton', function() {
    return this.click(selector('open-insert-document-modal-button'));
  });

  /**
   * Click the insert button in the insert document modal.
   */
  client.addCommand('clickInsertDocumentModalButton', function() {
    const base = selector('insert-document-button');
    return this.click(base).waitForVisibleInCompass(base, true);
  });

  /**
   * Click the edit document button.
   *
   * @param {Number} index - The index of the document, starting at 1.
   */
  client.addCommand('clickEditDocumentButton', function(index) {
    const base = `${selector('document-list-item')}:nth-child(${index})`;
    const button = `${base} ${selector('edit-document-button')}`;
    return this.moveToObject(base).waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click the clone document button.
   *
   * @param {Number} index - The index of the document, starting at 1.
   */
  client.addCommand('clickCloneDocumentButton', function(index) {
    const base = `${selector('document-list-item')}:nth-child(${index})`;
    const button = `${base} ${selector('clone-document-button')}`;
    return this.moveToObject(base).waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click the delete document button.
   *
   * @param {Number} index - The index of the document, starting at 1.
   */
  client.addCommand('clickDeleteDocumentButton', function(index) {
    const base = `${selector('document-list-item')}:nth-child(${index})`;
    const button = `${base} ${selector('delete-document-button')}`;
    return this.moveToObject(base).waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click the update document button.
   *
   * @param {Number} index - The index of the document, starting at 1.
   */
  client.addCommand('clickUpdateDocumentButton', function(index) {
    const base = `${selector('document-list-item')}:nth-child(${index})`;
    const button = `${base} ${selector('update-document-button')}`;
    return this.click(button);
  });

  /**
   * Click on the header in the index table.
   */
  client.addCommand('clickIndexTableHeader', function(columnName) {
    const base = selector('indexes-table');
    const column = selector(columnName);
    return this.click(`${base} ${column}`);
  });

  /**
   * Click the confirm delete document button.
   *
   * @param {Number} index - The index of the document, starting at 1.
   */
  client.addCommand('clickConfirmDeleteDocumentButton', function(index) {
    const base = `${selector('document-list-item')}:nth-child(${index})`;
    const button = `${base} ${selector('confirm-delete-document-button')}`;
    return this.click(button);
  });
  // clickNewFavoriteButton
  // clickSaveFavoriteButton
}

function addKeyPressCommands(client) {
  /**
   * Press escape
   */
  client.addCommand('pressEscape', function() {
    return this.keys(['Escape']);
  });

  /**
   * Press enter
   */
  client.addCommand('pressEnter', function() {
    return this.keys(['Enter']);
  });
}

/**
 * Add commands to the client to get values from the screen.
 *
 * @param {Client} client - The client.
 */
function addGetCommands(client) {

  /**
   * Get the slow operations list.
   */
  client.addCommand('getSlowestOperations', function() {
    const base = selector('no-slow-operations');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get the memory vsize from the memory graph.
   */
  client.addCommand('getMemoryVSize', function() {
    const base = selector('performance-virtual');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get the memory resident out from the memory graph.
   */
  client.addCommand('getMemoryResident', function() {
    const base = selector('performance-resident');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get the memory mapped from the memory graph.
   */
  client.addCommand('getMemoryMapped', function() {
    const base = selector('performance-mapped');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get the network bytes in from the network graph.
   */
  client.addCommand('getNetworkBytesIn', function() {
    const base = selector('performance-bytesIn');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get the network bytes out from the network graph.
   */
  client.addCommand('getNetworkBytesOut', function() {
    const base = selector('performance-bytesOut');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get the network connections from the network graph.
   */
  client.addCommand('getNetworkConnections', function() {
    const base = selector('performance-connections');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get active reads count from the read & write graph.
   */
  client.addCommand('getReadWriteActiveReads', function() {
    const base = selector('performance-aReads');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get active writes count from the read & write graph.
   */
  client.addCommand('getReadWriteActiveWrites', function() {
    const base = selector('performance-aWrites');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get queued reads count from the read & write graph.
   */
  client.addCommand('getReadWriteQueuedReads', function() {
    const base = selector('performance-qReads');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get queued writes count from the read & write graph.
   */
  client.addCommand('getReadWriteQueuedWrites', function() {
    const base = selector('performance-qWrites');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get insert count from the operations graph.
   */
  client.addCommand('getOperationsInserts', function() {
    const base = selector('performance-insert');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get query count from the operations graph.
   */
  client.addCommand('getOperationsQueries', function() {
    const base = selector('performance-query');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get update count from the operations graph.
   */
  client.addCommand('getOperationsUpdates', function() {
    const base = selector('performance-update');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get delete count from the operations graph.
   */
  client.addCommand('getOperationsDeletes', function() {
    const base = selector('performance-delete');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get command count from the operations graph.
   */
  client.addCommand('getOperationsCommands', function() {
    const base = selector('performance-command');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get getmore count from the operations graph.
   */
  client.addCommand('getOperationsGetMores', function() {
    const base = selector('performance-getmore');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get the status row message from the explain plan.
   */
  client.addCommand('getExplainPlanStatusMessage', function() {
    const base = selector('explain-plan-content');
    const row = `${base} .status-row-has-warning`;
    return this.waitForVisibleInCompass(row).getText(row);
  });

  /**
   * Get the number of returned documents from the explain plan screen.
   */
  client.addCommand('getExplainDocumentsReturned', function() {
    const base = selector('explain-returned-count');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get the number of keys examined from the explain plan screen.
   */
  client.addCommand('getExplainKeysExamined', function() {
    const base = selector('explain-examined-keys-count');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get the number of documents examined from the explain plan screen.
   */
  client.addCommand('getExplainDocumentsExamined', function() {
    const base = selector('explain-examined-count');
    return this.waitForVisibleInCompass(base).getText(base);
  });

  /**
   * Get the sampling message on the documents tab.
   */
  client.addCommand('getSamplingMessageFromDocumentsTab', function() {
    const base = selector('documents-content');
    const div = `${base} .sampling-message`;
    return this.waitForVisibleInCompass(div).getText(div);
  });

  /**
   * Get the sampling message on the schema tab.
   */
  client.addCommand('getSamplingMessageFromSchemaTab', function() {
    const base = selector('schema-content');
    const div = `${base} .sampling-message`;
    return this.waitForVisibleInCompass(div).getText(div);
  });

  /**
   * Get the field names in the schema field list
   */
  client.addCommand('getSchemaFieldNames', function() {
    const base = selector('schema-content');
    const div = `${base} .schema-field-name`;
    return this.waitForVisibleInCompass(div).getText(div);
  });

  /**
   * Get the document updated message.
   */
  client.addCommand('getDocumentMessage', function() {
    return this.getText(selector('document-message'));
  });

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
   * Get the ssh tunnel details.
   */
  client.addCommand('getSidebarSshTunnelDetails', function() {
    return this.getText(selector('sidebar-ssh-tunnel-details'));
  });


  /**
   * Get the sidebar database count
   */
  client.addCommand('getSidebarDatabaseCount', function() {
    return this.getText(selector('sidebar-db-count'));
  });

  /**
   * Get the sidebar collection count
   */
  client.addCommand('getSidebarCollectionCount', function() {
    return this.getText(selector('sidebar-collection-count'));
  });

  /**
   * Get the text from the modal dialog error section.
   */
  client.addCommand('getModalErrorMessage', function() {
    return this.getText('p.modal-status-error-message');
  });

  /**
   * Get a list of database names from the sidebar.
   */
  client.addCommand('getSidebarDatabaseNames', function() {
    return this.waitForSidebar('database').getText(selector('sidebar-database'));
  });

  client.addCommand('inputSidebarFilter', function(filter) {
    const base = selector('sidebar-filter-input');
    return this.setValue(base, filter);
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

  /**
   * Get a list of collection names from the sidebar.
   */
  client.addCommand('getSidebarCollectionNames', function() {
    return this.getAttribute(selector('sidebar-collection'), 'title');
  });

  /**
   * Get the document at the provided index in the list
   *
   * @param {Number} index - The index in the list, starting at 1.
   */
  client.addCommand('getDocumentAtIndex', function(index) {
    const base = selector('document-list-item');
    return this.getText(`${base}:nth-child(${index}) .editable-element-field, ${base}:nth-child(${index}) .element-field`).then((keys) => {
      return this.getText(`${base}:nth-child(${index}) .element-value`).then((values) => {
        return _.zipObject(keys, values);
      });
    });
  });

  /**
   * Get the read onnly status of the document at the provided index in the list
   * @type {Number} index - the index in the list, starting at 1.
   */
  client.addCommand('getDocumentReadonlyStatus', function(index) {
    const base = `${selector('document-list-item')} ${selector('readonly-document')}`;
    return this.isExisting(`${base}:nth-child(${index})`);
  });

  /**
   * Get the values of a document at the provided index in the list.
   *
   * @param {Number} index - The index in the list, starting at 1.
   */
  client.addCommand('getDocumentValues', function(index) {
    const base = selector('document-list-item');
    return this.getText(`${base}:nth-child(${index}) .element-value`);
  });

  /**
   * Get the index names in the table.
   *
   * @note Will return 1 element if only 1 in the list or an array if many.
   */
  client.addCommand('getIndexNames', function() {
    const names = selector('index-table-name');
    return this.waitForVisibleInCompass(names).getText(names);
  });

  /**
   * Get the index types in the table.
   *
   * @note Will return 1 element if only 1 in the list or an array if many.
   */
  client.addCommand('getIndexTypes', function() {
    const types = selector('index-table-type');
    return this.waitForVisibleInCompass(types).getText(types);
  });

  /**
   * Get the index sizes in the table.
   *
   * @note Will return 1 element if only 1 in the list or an array if many.
   */
  client.addCommand('getIndexSizes', function() {
    const sizes = selector('index-table-size');
    return this.waitForVisibleInCompass(sizes).getText(sizes);
  });

  /**
   * Get the index usages in the table.
   *
   * @note Will return 1 element if only 1 in the list or an array if many.
   */
  client.addCommand('getIndexUsages', function() {
    const usages = selector('index-table-usage');
    return this.waitForVisibleInCompass(usages).getText(usages);
  });

  /**
   * Get the index properties in the table.
   *
   * @note Will return 1 element if only 1 in the list or an array if many.
   */
  client.addCommand('getIndexProperties', function() {
    const base = selector('indexes-table');
    const props = `${base} td.property-column .properties .property`;
    return this.waitForVisibleInCompass(base).getText(props);
  });
}

/**
 * Add commands to the client for user input.
 *
 * @param {Client} client - The client.
 */
function addInputCommands(client) {

  /**
   * Enter the database name to drop.
   *
   * @param {String} name - The database name.
   */
  client.addCommand('inputDropDatabaseName', function(name) {
    return this.setValue(selector('confirm-drop-database-name'), name);
  });

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
   * Input the database details for creating a database.
   *
   * @param {Object} model - { name: 'dbname', collectionName: 'collName' }
   */
  client.addCommand('inputCreateDatabaseDetails', function(model) {
    return this
      .setValue('#create-database-name', model.name)
      .setValue('#create-database-collection-name', model.collectionName);
  });

  /**
   * Input create index details.
   *
   * @param {Object} model - The index model:
   *    {
   *      name: 'name_1',
   *      field: 'name',
   *      type: '1 (asc)'
   *    }
   */
  client.addCommand('inputCreateIndexDetails', function(model) {
    const that = this;
    let sequence = Promise.resolve();
    if (model.name) {
      sequence = sequence.then(function() {
        const field = selector('create-index-modal-name');
        return that
          .waitForVisibleInCompass(field)
          .setValue(field, model.name)
      });
    }
    if (model.field) {
      sequence = sequence.then(function() {
        const base = selector('create-index-modal-field-select');
        const field = `li=${model.field}`;
        return that
          .waitForVisibleInCompass(base)
          .click(base)
          .waitForVisibleInCompass(field)
          .click(field);
      });
    }
    if (model.type) {
      sequence = sequence.then(function() {
        const base = selector('create-index-modal-type-select');
        const field = `li=${model.type}`;
        return that
          .waitForVisibleInCompass(base)
          .click(base)
          .waitForVisibleInCompass(field)
          .click(field);
      });
    }
    return sequence;
  });

  /**
   * Clicks the Options button to expand the Query bar.
   */
  client.addCommand('clickQueryBarOptionsToggle', function() {
    const base = selector('querybar-options-toggle');
    return this.waitForVisibleInCompass(base).click(base);
  });
  /**
   * Inputs a filter into the collection level query bar from the schema tab.
   *
   * @param {String} filter - The filter.
   */
  client.addCommand('inputFilterFromSchemaTab', function(filter) {
    const base = selector('schema-content');
    const input = `${base} .input-filter`;
    return this.setValue(input, filter);
  });

  /**
   * Inputs a filter into the collection level query bar from the documents tab.
   *
   * @param {String} filter - The filter.
   */
  client.addCommand('inputFilterFromDocumentsTab', function(filter) {
    const base = selector('documents-content');
    const input = `${base} .input-filter`;
    return this.setValue(input, filter);
  });

  /**
   * Inputs a filter into the collection level query bar from the explain tab.
   *
   * @param {String} filter - The filter.
   */
  client.addCommand('inputFilterFromExplainPlanTab', function(filter) {
    const base = selector('explain-plan-content');
    const input = `${base} .input-filter`;
    return this.setValue(input, filter);
  });

  /**
   * Inputs a sort into the query bar from the explain plan tab.
   *
   * @param {String} filter - The filter.
  */
  client.addCommand('inputSortFromExplainPlanTab', function(filter) {
    const base = selector('explain-plan-content');
    const input = `${base} .input-sort`;
    return this.setValue(input, filter);
  });

  /**
   * Inputs a projection into the query bar from the explain plan tab.
   *
   * @param {String} filter - The filter.
  */
  client.addCommand('inputProjectFromExplainPlanTab', function(filter) {
    const base = selector('explain-plan-content');
    const input = `${base} .input-project`;
    return this.setValue(input, filter);
  });

  /**
   * Inputs a skip into the query bar from the documents tab.
   *
   * @param {String} filter - The filter.
   */
  client.addCommand('inputSkipFromExplainPlanTab', function(filter) {
    const base = selector('explain-plan-content');
    const input = `${base} .input-skip`;
    return this.setValue(input, filter);
  });

  /**
   * Inputs a limit into the query bar from the documents tab.
   *
   * @param {String} filter - The filter.
   */
  client.addCommand('inputLimitFromExplainPlanTab', function(filter) {
    const base = selector('explain-plan-content');
    const input = `${base} .input-limit`;
    return this.setValue(input, filter);
  });

  /**
   * Input a projection into the query from the schema tab.
   *
   * @type {String} filter - the filter.
   */
  client.addCommand('inputProjectFromSchemaTab', function(filter) {
    const base = selector('schema-content');
    const input = `${base} .input-project`;
    return this.setValue(input, filter);
  });

  /**
   * Input a limit into the query from the schema tab.
   *
   * @type {String} filter - the filter.
   */
  client.addCommand('inputLimitFromSchemaTab', function(filter) {
    const base = selector('schema-content');
    const input = `${base} .input-limit`;
    return this.setValue(input, filter);
  });

  /**
   * Inputs a projection into the query bar from the documents tab.
   *
   * @param {String} filter - The filter.
   */
  client.addCommand('inputProjectFromDocumentsTab', function(filter) {
    const base = selector('documents-content');
    const input = `${base} .input-project`;
    return this.setValue(input, filter);
  });

  /**
   * Inputs a sort into the query bar from the documents tab.
   *
   * @param {String} filter - The filter.
   */
  client.addCommand('inputSortFromDocumentsTab', function(filter) {
    const base = selector('documents-content');
    const input = `${base} .input-sort`;
    return this.setValue(input, filter);
  });

  /**
   * Inputs a skip into the query bar from the documents tab.
   *
   * @param {String} filter - The filter.
   */
  client.addCommand('inputSkipFromDocumentsTab', function(filter) {
    const base = selector('documents-content');
    const input = `${base} .input-skip`;
    return this.setValue(input, filter);
  });

  /**
   * Inputs a limit into the query bar from the documents tab.
   *
   * @param {String} filter - The filter.
   */
  client.addCommand('inputLimitFromDocumentsTab', function(filter) {
    const base = selector('documents-content');
    const input = `${base} .input-limit`;
    return this.setValue(input, filter);
  });

  /**
   * Input a change to a document value.
   *
   * @param {Number} index - The index of the document in the list.
   * @param {Object} oldValue - The old value.
   * @param {Object) newValue - The new value.
   */
  client.addCommand('inputDocumentValueChange', function(index, oldValue, newValue) {
    const base = `${selector('document-list-item')}:nth-child(${index})`;
    return this.setValue(`${base} input.editable-element-value[value='${oldValue}']`, newValue);
  });

  /**
   * Input a change to a cloned document value.
   *
   * @param {Number} index - The index of the document in the list.
   * @param {Object} oldValue - The old value.
   * @param {Object) newValue - The new value.
   */
  client.addCommand('inputClonedDocumentValueChange', function(index, oldValue, newValue) {
    const base = selector('insert-document-modal');
    return this.setValue(`${base} input.editable-element-value[value='${oldValue}']`, newValue);
  });

  /**
   * Insert a new document into the collection via the insert modal.
   *
   * @param {Object} model - The document to insert.
   */
  client.addCommand('inputNewDocumentDetails', function(model) {
    const base = selector('insert-document-modal');
    const that = this;
    const lineNumber = `${base} .document-elements .editable-element:last-child div.line-number`;
    const addField = `${lineNumber} ${selector('add-field-after')}`;
    let sequence = Promise.resolve();

    _.each(model, function(value, key) {
      sequence = sequence.then(function() {
        return that
          .setValue(`${base} input.editable-element-field[value='']`, key)
          .setValue(`${base} input.editable-element-value[value='']`, value)
          .moveToObject(lineNumber)
          .click(lineNumber)
          .waitForVisibleInCompass(addField)
          .click(addField);
      });
    });
    return sequence;
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
    _.each(staticFields, function(field) {
      if (model[field]) {
        sequence = sequence.then(function() {
          return that.setValue(format('input[name=%s]', field), model[field]);
        });
      }
    });

    if (model.authentication && model.authentication !== 'NONE') {
      sequence = sequence.then(function() {
        return that.selectByValue('select[name=authentication]', model.authentication);
      });
      const authFields = client.getFieldNames(model.authentication);
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
      const sslFields = ['ssl_ca', 'ssl_certificate', 'ssl_private_key',
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
    addKeyPressCommands(client);
    addGetCommands(client);
    addInputCommands(client);
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
