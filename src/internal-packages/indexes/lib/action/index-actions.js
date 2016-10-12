const Reflux = require('reflux');

const IndexActions = Reflux.createActions([
  'loadIndexes',
  'sortIndexes',
  'dropIndex'
]);

module.exports = IndexActions;
