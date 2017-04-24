const Reflux = require('reflux');

/**
 * The actions used by the Chart components.
 */
const Actions = Reflux.createActions([
  'mapFieldToChannel',
  'swapEncodedChannels',
  'selectMeasurement',
  'selectAggregate',
  'selectChartType',
  'clearChart',
  'undoAction',
  'redoAction'
]);

module.exports = Actions;
