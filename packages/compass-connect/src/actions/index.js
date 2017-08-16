const Reflux = require('reflux');

const ConnectActions = Reflux.createActions([
  'onHostnameChanged',
  'onPortChanged',
  'onReadPreferenceChanged',
  'onReplicaSetNameChanged'
]);

module.exports = ConnectActions;
