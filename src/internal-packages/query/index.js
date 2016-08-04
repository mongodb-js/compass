const app = require('ampersand-app');
const QueryBarComponent = require('./lib/component');
const SamplingMessage = require('./lib/component/sampling-message');
const QueryAction = require('./lib/action');
const QueryStore = require('./lib/store');

/**
 * Activate all the components in the Query Bar package.
 */
function activate() {
  app.appRegistry.registerComponent('App:QueryBar', QueryBarComponent);
  app.appRegistry.registerComponent('Component::Query::SamplingMessage', SamplingMessage);
  app.appRegistry.registerAction('QueryAction', QueryAction);
  app.appRegistry.registerStore('QueryStore', QueryStore);
}

/**
 * Deactivate all the components in the Query Bar package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('App:QueryBar');
  app.appRegistry.deregisterComponent('Component::Query::SamplingMessage');
  app.appRegistry.deregisterAction('QueryAction');
  app.appRegistry.deregisterStore('QueryStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
