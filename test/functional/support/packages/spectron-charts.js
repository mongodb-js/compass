const { selector } = require('hadron-spectron');


function addClickChartsCommands(client) {
  /**
   * Click on the charts tab.
   */
  client.addCommand('clickChartsTab', function() {
    return this.waitForStatusBar().click(selector('charts-tab'));
  });

  /**
   * Click the apply filter button from the charts tab.
   */
  client.addCommand('clickApplyFilterButtonFromChartsTab', function() {
    const base = selector('charts-content');
    const button = `${base} ${selector('apply-filter-button')}`;
    return this.waitForVisibleInCompass(button).click(button);
  });

  /**
   * Click the reset filter button from the charts tab.
   */
  client.addCommand('clickResetFilterButtonFromChartsTab', function() {
    const base = selector('documents-content');
    const button = `${base} ${selector('reset-filter-button')}`;
    return this.waitForVisibleInCompass(button).click(button);
  });
}


function addGetChartsCommands(client) {
  /**
   * Gets the human-readable text of the charts tab.
   */
  client.addCommand('getChartsTabText', function() {
    return this.getText(selector('charts-tab'));
  });

  /**
   * Get a list of <DraggableField> item names from the Charts <FieldPanel>.
   */
  client.addCommand('getFieldPanelItemTitles', function() {
    const base = selector('chart-builder-field-panel');
    return this.getAttribute(`${base} .chart-draggable-field`, 'title');
  });
}


function addInputChartsCommands(client) {
  /**
   * Inputs a filter into the collection level query bar from the charts tab.
   *
   * @param {String} filter - The filter.
   */
  client.addCommand('inputFilterFromChartsTab', function(filter) {
    const base = selector('charts-content');
    const input = `${base} .ReactCodeMirror`;
    return this.waitForVisibleInCompass(input).click(input).keys(filter);
  });
}


/**
 * Add commands to the client related to the charts tab.
 *
 * @param {Client} client - The client.
 */
function addChartsCommands(client) {
  addClickChartsCommands(client);
  addGetChartsCommands(client);
  addInputChartsCommands(client);
}


module.exports = addChartsCommands;
