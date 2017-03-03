const selector = require('../spectron-selector');


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
}


function addGetExplainCommands(client) {
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
