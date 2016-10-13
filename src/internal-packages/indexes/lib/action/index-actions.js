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
  'updateStatus'
]);

module.exports = IndexActions;
