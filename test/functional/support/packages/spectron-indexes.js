const selector = require('../spectron-selector');


function addWaitIndexesCommands(client) {
  /**
   * Waits for the create index modal to open.
   */
  client.addCommand('waitForCreateIndexModal', function() {
    return this.waitForVisibleInCompass(selector('create-index-modal'));
  });

  /**
   * Wait for the index with the provided name to be created.
   *
   * @param {String} name - The index name.
   */
  client.addCommand('waitForIndexCreation', function(name) {
    const table = selector('index-table-name');
    const cell = `${table}[title=${name}]`;
    return this.waitForStatusBar().waitForVisibleInCompass(cell);
  });
}


function addClickIndexesCommands(client) {
  /**
   * Click on the indexes tab.
   */
  client.addCommand('clickIndexesTab', function() {
    return this.waitForStatusBar().click(selector('indexes-tab'));
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
   * Click the create index button in the modal.
   */
  client.addCommand('clickCreateIndexModalButton', function() {
    const form = selector('create-index-modal');
    return this.submitForm(`${form} form`);
  });

  /**
   * Click on the header in the index table.
   */
  client.addCommand('clickIndexTableHeader', function(columnName) {
    const base = selector('indexes-table');
    const column = selector(columnName);
    return this.click(`${base} ${column}`);
  });
}


function addGetIndexesCommands(client) {
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


function addInputIndexesCommands(client) {
  /**
   * Input create index details.
   *
   * @param {Object} model - The index model:
   *    {
   *      name: 'name_1',
   *      field: 'name',
   *      typeIndex: '1' // the index of the type that starts at 1 and ends at 3
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
          .setValue(field, model.name);
      });
    }
    if (model.field) {
      sequence = sequence.then(function() {
        const base = selector('create-index-modal-field-select');
        const input = `${base} .Select .Select-control .Select-multi-value-wrapper .Select-input input`;
        return that
          .waitForVisibleInCompass(base)
          .click(base)
          .waitForVisibleInCompass(input)
          .setValue(input, model.field)
          .pressEnter();
      });
    }
    if (model.typeIndex >= 0) {
      sequence = sequence.then(function() {
        const base = selector('create-index-modal-type-select');
        const input = `${base} .Select .Select-control .Select-multi-value-wrapper`;
        return that
          .waitForVisibleInCompass(base)
          .click(base)
          .waitForVisibleInCompass(input)
          .click(input)
          .pressDown(model.typeIndex)
          .pressEnter();
      });
    }
    return sequence;
  });
}


/**
 * Add commands to the client related to the Indexes Tab.
 *
 * @param {Client} client - The client.
 */
function addIndexesCommands(client) {
  addWaitIndexesCommands(client);
  addClickIndexesCommands(client);
  addGetIndexesCommands(client);
  addInputIndexesCommands(client);
}


module.exports = addIndexesCommands;
