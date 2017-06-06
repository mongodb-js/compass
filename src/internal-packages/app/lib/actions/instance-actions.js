const Reflux = require('reflux');

const InstanceActions = Reflux.createActions([
  'fetchFirstInstance',
  'refreshInstance'
]);

module.exports = InstanceActions;
