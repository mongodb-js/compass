const _ = require('lodash');
const semver = require('semver');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const assert = require('assert');
const format = require('util').format;
const path = require('path');
const electronPrebuilt = require('electron-prebuilt');
const Application = require('spectron').Application;

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
    return this.waitForExist(base, TIMEOUT, true);
  });

  /**
   * Wait for the connect screen to finish loading.
   */
  client.addCommand('waitForConnectView', function() {
    return this.waitForVisible(selector('connect-form'), TIMEOUT);
  });

  /**
   * Wait for the home screen to finish loading.
   */
  client.addCommand('waitForHomeView', function() {
    return this.waitForVisible(selector('instance-sidebar'), TIMEOUT);
  });

  /**
   * Wait for the feature tour modal to open.
   */
  client.addCommand('waitForFeatureTourModal', function() {
    return this.waitForVisible(selector('feature-tour-modal'), TIMEOUT);
  });

  /**
   * Wait for the privacy settings modal to open.
   */
  client.addCommand('waitForPrivacySettingsModal', function() {
    return this.waitForVisible(selector('privacy-settings-modal'), TIMEOUT);
  });

  /**
   * Waits for the status bar to finish its progress and unlock the page.
   */
  client.addCommand('waitForStatusBar', function() {
    return this.waitForVisible(selector('status-bar'), TIMEOUT, true);
  });

  /**
   * Waits for the create index modal to open.
   */
  client.addCommand('waitForCreateIndexModal', function() {
    return this.waitForVisible(selector('create-index-modal'), TIMEOUT);
  });

  /**
   * Waits for the create database modal to open.
   */
  client.addCommand('waitForCreateDatabaseModal', function() {
    return this.waitForVisible(selector('create-database-modal'), TIMEOUT);
  });

  /**
   * Waits for the create collection modal to open.
   */
  client.addCommand('waitForCreateCollectionModal', function() {
    return this.waitForVisible(selector('create-collection-modal'), TIMEOUT);
  });

  /**
   * Waits for the drop database modal to open.
   */
  client.addCommand('waitForDropDatabaseModal', function() {
    return this.waitForVisible(selector('drop-database-modal'), TIMEOUT);
  });

  /**
   * Waits for the drop collection modal to open.
   */
  client.addCommand('waitForDropCollectionModal', function() {
    return this.waitForVisible(selector('drop-collection-modal'), TIMEOUT);
  });

  /**
   * Wait for a modal error message to appear.
   */
  client.addCommand('waitForModalError', function() {
    return this.waitForVisible(selector('modal-message'), TIMEOUT);
  });

  /**
   * Wait for the database screen to load.
   */
  client.addCommand('waitForDatabaseView', function() {
    return this.waitForVisible(selector('collections-table'), TIMEOUT);
  });

  /**
   * Wait for the insert document modal to open.
   */
  client.addCommand('waitForInsertDocumentModal', function() {
    return this.waitForVisible(selector('insert-document-modal'), TIMEOUT);
  });

  /**
   * Wait for a document to be inserted at the index.
   *
   * @param {Number} index - The document index.
   */
  client.addCommand('waitForDocumentInsert', function(index) {
    const base = selector('document-list-item');
    return this.waitForExist(`${base}:nth-child(${index})`, TIMEOUT);
  });

  /**
   * Wait for the edit document to complete.
   *
   * @param {Number} index - The index of the document in the list.
   */
  client.addCommand('waitForDocumentUpdate', function(index) {
    const base = selector('document-list-item');
    const message = `${base}:nth-child(${index}) ${selector('document-message')}`;
    return this.waitForExist(message, TIMEOUT, true);
  });

  /**
   * Wait for the index with the provided name to be created.
   *
   * @param {String} name - The index name.
   */
  client.addCommand('waitForIndexCreation', function(name) {
    return this
      .waitUntil(function() {
        return this.getIndexNames().then(function(names) {
          return names.includes(name);
        });
      }, TIMEOUT);
  });

  /**
   * Wait for the database with the provided name to be created.
   *
   * @param {String} name - The database name.
   */
  client.addCommand('waitForDatabaseCreation', function(name) {
    const base = selector('databases-table');
    const row = `${base} ${selector('sortable-table-column-0')}[title=${name}]`;
    return this.waitForExist(row, TIMEOUT);
  });

  /**
   * Wait for the collection with the provided name to be created.
   *
   * @param {String} name - The collection name.
   */
  client.addCommand('waitForCollectionCreation', function(name) {
    const base = selector('collections-table');
    const row = `${base} ${selector('sortable-table-column-0')}[title=${name}]`;
    return this.waitForExist(row, TIMEOUT);
  });

  /**
   * Wait for the database with the provided name to be deleted.
   *
   * @param {String} name - The database name.
   */
  client.addCommand('waitForDatabaseDeletion', function(name) {
    const base = selector('databases-table');
    const row = `${base} ${selector('sortable-table-column-0')}[title=${name}]`;
    return this.waitForExist(row, TIMEOUT, true);
  });

  /**
   * Wait for the collection with the provided name to be deleted.
   *
   * @param {String} name - The collection name.
   */
  client.addCommand('waitForCollectionDeletion', function(name) {
    const base = selector('collections-table');
    const row = `${base} ${selector('sortable-table-column-0')}[title=${name}]`;
    return this.waitForExist(row, TIMEOUT, true);
  });
}

/**
 * Add commands to the client for clicking links and buttons in the application.
 *
 * @param {Client} client - The client.
 */
function addClickCommands(client) {

  /**
   * Click the LAST delete database trash icon in the list.
   *
   * @param {String} name - The name of the database to delete.
   */
  client.addCommand('clickDeleteDatabaseButton', function(name) {
    const base = selector('databases-table');
    const wrapper = selector('sortable-table-delete');
    const button = `${base} ${wrapper}[title='Delete ${name}']`;
    return this.waitForVisible(base, TIMEOUT).click(button);
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
    return this.waitForVisible(base, TIMEOUT).click(button);
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
      .waitForVisible(base, TIMEOUT, true)
      .waitUntil(function() {
        return this.getText('div[data-hook=optin-container]').then(function(text) {
          return text.length === 0;
        });
      });
  });

  /**
   * Click on a collection in the sidebar.
   *
   * @param {String} name - The full collection name.
   */
  client.addCommand('clickCollectionInSidebar', function(name) {
    const base = `${selector('sidebar-collection')}[title='${name}']`;
    return this.waitForVisible(base, TIMEOUT).click(base);
  });

  /**
   * Click on a database in the sidebar.
   *
   * @param {String} name - The database name.
   */
  client.addCommand('clickDatabaseInSidebar', function(name) {
    const base = `${selector('sidebar-database')}[title='${name}']`;
    return this.waitForVisible(base, TIMEOUT).click(base);
  });

  /**
   * Click the apply filter button from the documents tab.
   */
  client.addCommand('clickApplyFilterButtonFromDocumentsTab', function() {
    const base = selector('documents-content');
    const button = `${base} .apply-filter-button`;
    return this.waitForVisible(button).click(button);
  });

  /**
   * Click the reset filter button from the documents tab.
   */
  client.addCommand('clickResetFilterButtonFromDocumentsTab', function() {
    const base = selector('documents-content');
    const button = `${base} .reset-filter-button`;
    return this.waitForVisible(button).click(button);
  });

  /**
   * Click the apply filter button from the schema tab.
   */
  client.addCommand('clickApplyFilterButtonFromSchemaTab', function() {
    const base = selector('schema-content');
    const button = `${base} .apply-filter-button`;
    return this.waitForVisible(button).click(button);
  });

  /**
   * Click the reset filter button from the schema tab.
   */
  client.addCommand('clickResetFilterButtonFromSchemaTab', function() {
    const base = selector('schema-content');
    const button = `${base} .reset-filter-button`;
    return this.waitForVisible(button).click(button);
  });

  /**
   * Click the apply filter button from the explain plan tab.
   */
  client.addCommand('clickApplyFilterButtonFromExplainPlanTab', function() {
    const base = selector('explain-plan-content');
    const button = `${base} .apply-filter-button`;
    return this.waitForVisible(button).click(button);
  });

  /**
   * Click the reset filter button from the explain plan tab.
   */
  client.addCommand('clickResetFilterButtonFromExplainPlanTab', function() {
    const base = selector('explain-plan-content');
    const button = `${base} .reset-filter-button`;
    return this.waitForVisible(button).click(button);
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
    return this.waitForStatusBar().click(selector('open-create-index-modal-button'));
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
    const base = selector('create-index-button');
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
    return this.click(base).waitForVisible(base, TIMEOUT, true);
  });

  /**
   * Click the edit document button.
   *
   * @param {Number} index - The index of the document, starting at 1.
   */
  client.addCommand('clickEditDocumentButton', function(index) {
    const base = `${selector('document-list-item')}:nth-child(${index})`;
    const button = `${base} ${selector('edit-document-button')}`;
    return this.moveToObject(base).waitForVisible(button, TIMEOUT).click(button);
  });

  /**
   * Click the clone document button.
   *
   * @param {Number} index - The index of the document, starting at 1.
   */
  client.addCommand('clickCloneDocumentButton', function(index) {
    const base = `${selector('document-list-item')}:nth-child(${index})`;
    const button = `${base} ${selector('clone-document-button')}`;
    return this.moveToObject(base).waitForVisible(button, TIMEOUT).click(button);
  });

  /**
   * Click the delete document button.
   *
   * @param {Number} index - The index of the document, starting at 1.
   */
  client.addCommand('clickDeleteDocumentButton', function(index) {
    const base = `${selector('document-list-item')}:nth-child(${index})`;
    const button = `${base} ${selector('delete-document-button')}`;
    return this.moveToObject(base).waitForVisible(button, TIMEOUT).click(button);
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
   * Click on the name header in the index table.
   */
  client.addCommand('clickIndexTableNameHeader', function() {
    const base = selector('indexes-table');
    const column = selector('th-name');
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

/**
 * Add commands to the client to get values from the screen.
 *
 * @param {Client} client - The client.
 */
function addGetCommands(client) {

  /**
   * Get the status row message from the explain plan.
   */
  client.addCommand('getExplainPlanStatusMessage', function() {
    const base = selector('explain-plan-content');
    const row = `${base} .status-row-has-warning`;
    return this.waitForVisible(row).getText(row, TIMEOUT);
  });

  /**
   * Get the number of returned documents from the explain plan screen.
   */
  client.addCommand('getExplainDocumentsReturned', function() {
    const base = selector('explain-returned-count');
    return this.waitForVisible(base).getText(base, TIMEOUT);
  });

  /**
   * Get the number of keys examined from the explain plan screen.
   */
  client.addCommand('getExplainKeysExamined', function() {
    const base = selector('explain-examined-keys-count');
    return this.waitForVisible(base).getText(base, TIMEOUT);
  });

  /**
   * Get the number of documents examined from the explain plan screen.
   */
  client.addCommand('getExplainDocumentsExamined', function() {
    const base = selector('explain-examined-count');
    return this.waitForVisible(base).getText(base, TIMEOUT);
  });

  /**
   * Get the sampling message on the documents tab.
   */
  client.addCommand('getSamplingMessageFromDocumentsTab', function() {
    const base = selector('documents-content');
    const div = `${base} .sampling-message`;
    return this.waitForVisible(div).getText(div, TIMEOUT);
  });

  /**
   * Get the sampling message on the schema tab.
   */
  client.addCommand('getSamplingMessageFromSchemaTab', function() {
    const base = selector('schema-content');
    const div = `${base} .sampling-message`;
    return this.waitForVisible(div).getText(div, TIMEOUT);
  });

  /**
   * Get the document updated message.
   */
  client.addCommand('getDocumentMessage', function() {
    return this.getText(selector('document-message'), TIMEOUT);
  });

  /**
   * Get the title of the standard Compass modal dialog.
   */
  client.addCommand('getModalTitle', function() {
    return this.getText(selector('modal-title'), TIMEOUT);
  });

  /**
   * Get the instance address from the sidebar.
   */
  client.addCommand('getSidebarInstanceDetails', function() {
    return this.getText(selector('sidebar-instance-details'), TIMEOUT);
  });

  /**
   * Get the ssh tunnel details.
   */
  client.addCommand('getSidebarSshTunnelDetails', function() {
    return this.getText(selector('sidebar-ssh-tunnel-details'), TIMEOUT);
  });

  /**
   * Get the sidebar instance version.
   */
  client.addCommand('getSidebarInstanceVersion', function() {
    return this.getText(selector('sidebar-instance-version'), TIMEOUT);
  });

  /**
   * Get the sidebar database count
   */
  client.addCommand('getSidebarDatabaseCount', function() {
    return this.getText(selector('sidebar-db-count'), TIMEOUT);
  });

  /**
   * Get the sidebar collection count
   */
  client.addCommand('getSidebarCollectionCount', function() {
    return this.getText(selector('sidebar-collection-count'), TIMEOUT);
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
    return this.getText(selector('sidebar-database'));
  });

  /**
   * Get a list of database names from the home view.
   */
  client.addCommand('getHomeViewDatabaseNames', function() {
    return this
      .waitForVisible(selector('databases-table'))
      .getText(selector('sortable-table-column-0'));
  });

  /**
   * Get a list of collection names from the database view.
   */
  client.addCommand('getDatabaseViewCollectionNames', function() {
    return this
      .waitForVisible(selector('collections-table'))
      .getText(selector('sortable-table-column-0'));
  });

  /**
   * Get a list of collection names from the sidebar.
   */
  client.addCommand('getSidebarCollectionNames', function() {
    return this.getAttribute(selector('sidebar-collection'), 'title');
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
    const base = selector('indexes-table');
    const names = `${base} td.name-column .index-definition .name`;
    return this.waitForVisible(base, TIMEOUT).getText(names);
  });

  /**
   * Get the index types in the table.
   *
   * @note Will return 1 element if only 1 in the list or an array if many.
   */
  client.addCommand('getIndexTypes', function() {
    const base = selector('indexes-table');
    const types = `${base} td.type-column .property`;
    return this.waitForVisible(base, TIMEOUT).getText(types);
  });

  /**
   * Get the index sizes in the table.
   *
   * @note Will return 1 element if only 1 in the list or an array if many.
   */
  client.addCommand('getIndexSizes', function() {
    const base = selector('indexes-table');
    const sizes = `${base} td.size-column .quantity`;
    return this.waitForVisible(base, TIMEOUT).getText(sizes);
  });

  /**
   * Get the index usages in the table.
   *
   * @note Will return 1 element if only 1 in the list or an array if many.
   */
  client.addCommand('getIndexUsages', function() {
    const base = selector('indexes-table');
    const usages = `${base} td.usage-column .usage .quantity`;
    return this.waitForVisible(base, TIMEOUT).getText(usages);
  });

  /**
   * Get the index properties in the table.
   *
   * @note Will return 1 element if only 1 in the list or an array if many.
   */
  client.addCommand('getIndexProperties', function() {
    const base = selector('indexes-table');
    const props = `${base} td.property-column .properties .property`;
    return this.waitForVisible(base, TIMEOUT).getText(props);
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
        return that.setValue(selector('create-index-modal-name'), model.name)
      });
    }
    if (model.field) {
      sequence = sequence.then(function() {
        const base = selector('create-index-modal-field-select');
        return that.click(base).click(`li=${model.field}`);
      });
    }
    if (model.type) {
      sequence = sequence.then(function() {
        const base = selector('create-index-modal-type-select');
        return that.click(base).click(`li=${model.type}`);
      });
    }
    return sequence;
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
    const that = this;
    let sequence = Promise.resolve();
    _.each(model, function(value, key) {
      sequence = sequence.then(function() {
        return that
          .setValue(".modal-dialog input.editable-element-field[value='']", key)
          .setValue(".modal-dialog input.editable-element-value[value='']", value)
          .click('.modal-dialog div.hotspot:last-child')
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
  const dir = path.join(__dirname, '..', '..');
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
    addWaitCommands(client);
    addClickCommands(client);
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
