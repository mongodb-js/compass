const Reflux = require('reflux');

const InstanceActions = Reflux.createActions([
  'setInstance', 'refreshInstance'
]);

module.exports = InstanceActions;
