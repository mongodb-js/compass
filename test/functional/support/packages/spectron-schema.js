const { selector } = require('hadron-spectron');


function addClickSchemaCommands(client) {
  /**
   * Click on the schema tab.
   */
  client.addCommand('clickSchemaTab', function() {
    return this.waitForStatusBar().click(selector('schema-tab'));
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
}


function addGetSchemaCommands(client) {
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
}


function addInputSchemaCommands(client) {
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
}


/**
 * Add commands to the client related to the Schema Tab.
 *
 * @param {Client} client - The client.
 */
function addSchemaCommands(client) {
  addClickSchemaCommands(client);
  addGetSchemaCommands(client);
  addInputSchemaCommands(client);
}


module.exports = addSchemaCommands;
