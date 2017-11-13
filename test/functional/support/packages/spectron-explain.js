const { selector } = require('hadron-spectron');


function addClickExplainCommands(client) {
  /**
   * Click on the explain plan tab.
   */
  client.addCommand('clickExplainPlanTab', function() {
    return this.waitForStatusBar().click(selector('explain-plan-tab'));
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
   * Click one of the view details as buttons
   *
   * @param {String} view - the value should be either 'visual-tree' or 'raw json'
   */
  client.addCommand('clickExplainViewDetails', function(view) {
    const button = selector('explain-view-' + view);
    return this.click(button);
  });
}


function addGetExplainCommands(client) {
  /**
   * Get the status row message from the explain plan.
   */
  client.addCommand('getExplainPlanStatusMessage', function() {
    const row = '.compass-explain .zero-state-header';
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
   * Get the explain plan raw json object
   */
  client.addCommand('getExplainRawJSONDocument', function() {
    const base = `${selector('readonly-document')} .element-value-is-string`;
    return this.waitForVisibleInCompass(base).getText(base).then((values) => {
      return values.map((str) => str.replace(/"/g, ''));
    });
  });
}

function addInputExplainCommands(client) {
  /**
   * Inputs a filter into the collection level query bar from the explain tab.
   *
   * @param {String} filter - The filter.
   */
  client.addCommand('inputFilterFromExplainPlanTab', function(filter) {
    const base = selector('explain-plan-content');
    const input = `${base} .input-filter`;
    return this.waitForVisibleInCompass(input).click(input).keys(filter);
  });

  /**
   * Inputs a sort into the query bar from the explain plan tab.
   *
   * @param {String} filter - The filter.
  */
  client.addCommand('inputSortFromExplainPlanTab', function(sort) {
    const base = selector('explain-plan-content');
    const input = `${base} .input-sort`;
    return this.waitForVisibleInCompass(input).click(input).keys(sort);
  });

  /**
   * Inputs a projection into the query bar from the explain plan tab.
   *
   * @param {String} filter - The filter.
  */
  client.addCommand('inputProjectFromExplainPlanTab', function(projection) {
    const base = selector('explain-plan-content');
    const input = `${base} .input-project`;
    return this.waitForVisibleInCompass(input).click(input).keys(projection);
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
}

/**
 * Add commands to the client related to the Explain Tab.
 *
 * @param {Client} client - The client.
 */
function addExplainCommands(client) {
  addClickExplainCommands(client);
  addGetExplainCommands(client);
  addInputExplainCommands(client);
}


module.exports = addExplainCommands;
