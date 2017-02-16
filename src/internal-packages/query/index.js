const app = require('hadron-app');
const QueryBarComponent = require('./lib/component');
const SamplingMessage = require('./lib/component/sampling-message');
const QueryAction = require('./lib/action');
const QueryStore = require('./lib/store/query-store');
const QueryChangedStore = require('./lib/store/query-changed-store');

/**
 * Activate all the components in the Query Bar package.
 */
function activate() {
  app.appRegistry.registerComponent('Query.QueryBar', QueryBarComponent);
  app.appRegistry.registerComponent('Query.SamplingMessage', SamplingMessage);
  app.appRegistry.registerAction('Query.Actions', QueryAction);
  app.appRegistry.registerStore('Query.Store', QueryStore);
  app.appRegistry.registerStore('Query.ChangedStore', QueryChangedStore);
}

/**
 * Deactivate all the components in the Query Bar package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Query.QueryBar');
  app.appRegistry.deregisterComponent('Query.SamplingMessage');
  app.appRegistry.deregisterAction('Query.Actions');
  app.appRegistry.deregisterStore('Query.Store');
  app.appRegistry.deregisterStore('Query.ChangedStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
