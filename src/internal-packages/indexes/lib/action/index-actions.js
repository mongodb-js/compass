const Reflux = require('reflux');

const IndexActions = Reflux.createActions([
  'createIndex',
  'clearForm',
  'dropIndex',
  'loadIndexes',
  'sortIndexes',
  'triggerIndexCreation',
  'updateField',
  'updateOption',
  'updateStatus',
  'addRowIndex',
  'updateRowFieldName',
  'updateRowFieldType',
  'removeRowIndex'
]);

module.exports = IndexActions;
