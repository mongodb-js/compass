const Reflux = require('reflux');

/**
 * The actions used by the Chart components.
 */
const Actions = Reflux.createActions([
  'selectField',
  'selectMeasurement',
  'selectAggregate',
  'selectChartType',
  'clearChart'
]);

module.exports = Actions;
