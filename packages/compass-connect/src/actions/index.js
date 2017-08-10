const Reflux = require('reflux');

const ConnectActions = Reflux.createActions([
  'onHostnameChanged',
  'onPortChanged'
]);

module.exports = ConnectActions;
