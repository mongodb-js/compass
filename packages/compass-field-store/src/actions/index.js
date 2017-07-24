const Reflux = require('reflux');

/**
 * The actions used by the Chart components.
 */
const FieldActions = Reflux.createActions([
  'processDocuments',
  'processSingleDocument',
  'processSchema',
  'reset'
]);

module.exports = FieldActions;
