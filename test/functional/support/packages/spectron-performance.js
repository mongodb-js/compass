const selector = require('../spectron-selector');


function addClickPerformanceCommands(client) {
  /**
   * Click on the performance tab.
   */
  client.addCommand('clickPerformanceTab', function() {
    return this.waitForStatusBar().click(selector('performance-tab'));
  });

  /**
   * Click the pause button the performance tab.
   */
  client.addCommand('clickPerformancePauseButton', function() {
    const button = selector('performance-pause');
    return this.waitForVisibleInCompass(button).click(button);
  });
}


function addGetPerformanceCommands(client) {
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
}


/**
 * Add commands to the client related to the Performance Tab and real time
 * server stats features.
 *
 * @param {Client} client - The client.
 */
function addPerformanceCommands(client) {
  addClickPerformanceCommands(client);
  addGetPerformanceCommands(client);
}


module.exports = addPerformanceCommands;
