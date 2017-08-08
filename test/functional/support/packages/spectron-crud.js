const _ = require('lodash');
const { selector } = require('hadron-spectron');

function addWaitCRUDCommands(client) {
  /**
   * Wait for the insert document modal to open.
   */
  client.addCommand('waitForInsertDocumentModal', function() {
    return this.waitForVisibleInCompass(selector('insert-document-modal'));
  });
  client.addCommand('waitForInsertDocumentModalHidden', function() {
    return this.waitForVisibleInCompass(selector('insert-document-modal'), true);
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
   * Wait for document deletion to finish.
   *
   * @param {Number} index - The index of the document being deleted.
   */
  client.addCommand('waitForDocumentDeletionToComplete', function(index) {
    const base = `${selector('document-list-item')}:nth-child(${index})`;
    return this.waitForExistInCompass(base, true);
  });
}


function addClickCRUDCommands(client) {
  /**
   * Click on the documents tab.
   */
  client.addCommand('clickDocumentsTab', function() {
    return this.waitForStatusBar().click(selector('documents-tab'));
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
   * Click the refresh documents button.
   */
  client.addCommand('clickRefreshDocumentsButton', function() {
    const button = selector('refresh-documents-button');
    return this.waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click the insert document button.
   */
  client.addCommand('clickInsertDocumentButton', function() {
    return this.click(selector('open-insert-document-modal-button'));
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
   * Double click the document field at docIndex and at field fieldIndex
   */
  client.addCommand('doubleClickDocumentField', function(docIndex, fieldIndex) {
    const base = `${selector('document-list-item')}:nth-child(${docIndex})`;
    const field = `${base} .editable-element:nth-child(${fieldIndex}) .editable-element-field`;
    return this.moveToObject(base).waitForVisibleInCompass(field).doubleClick(field);
  });

  /**
   * Double click the document value at docIndex and at value fieldIndex
   */
  client.addCommand('doubleClickDocumentValue', function(docIndex, fieldIndex) {
    const base = `${selector('document-list-item')}:nth-child(${docIndex})`;
    const value = `${base} .editable-element:nth-child(${fieldIndex}) .element-value`;
    return this.moveToObject(base).waitForVisibleInCompass(value).doubleClick(value);
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
   * Click the insert button in the insert document modal.
   */
  client.addCommand('clickInsertDocumentModalButton', function() {
    const base = selector('insert-document-button');
    return this.click(base).waitForVisibleInCompass(base, true);
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
}


function addGetCRUDCommands(client) {
  /**
   * Get the sampling message on the documents tab.
   */
  client.addCommand('getSamplingMessageFromDocumentsTab', function() {
    const base = selector('documents-content');
    const div = `${base} .sampling-message`;
    return this.waitForVisibleInCompass(div).getText(div);
  });

  /**
   * Get the document updated message.
   */
  client.addCommand('getDocumentMessage', function() {
    return this.getText(selector('document-message'));
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
   * Get the read only status of the document at the provided index in the list
   * @type {Number} index - the index in the list, starting at 1.
   */
  client.addCommand('getDocumentReadonlyStatus', function(index) {
    const base = `${selector('document-list-item')} ${selector('readonly-document')}`;
    return this.isExisting(`${base}:nth-child(${index})`);
  });

  client.addCommand('getDocumentFields', function(index) {
    const base = selector('document-list-item');
    return this.getText(`${base}:nth-child(${index}) .editable-element-field`);
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
}


function addInputCRUDCommands(client) {
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
   * @param {Object} newValue - The new value.
   */
  client.addCommand('inputDocumentFieldChange', function(index, oldValue, newValue) {
    const base = `${selector('document-list-item')}:nth-child(${index})`;
    return this.setValue(`${base} input.editable-element-field[value='${oldValue}']`, newValue);
  });

  /**
   * Input a change to a document value.
   *
   * @param {Number} index - The index of the document in the list.
   * @param {Object} oldValue - The old value.
   * @param {Object} newValue - The new value.
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
}


/**
 * Add commands to the client related to the Documents Tab.
 *
 * @param {Client} client - The client.
 */
function addCRUDCommands(client) {
  addWaitCRUDCommands(client);
  addClickCRUDCommands(client);
  addGetCRUDCommands(client);
  addInputCRUDCommands(client);
}

module.exports = addCRUDCommands;
