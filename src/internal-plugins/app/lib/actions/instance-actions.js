const Reflux = require('reflux');

const InstanceActions = Reflux.createActions({
  fetchFirstInstance: {sync: true},
  refreshInstance: {sync: false}
});

module.exports = InstanceActions;
