const app = require('ampersand-app');
const QueryBarComponent = require('./lib/component');
const QueryAction = require('./lib/action');
const QueryStore = require('./lib/store');
/**
 * Activate all the components in the Query Bar package.
 */
function activate() {
  app.appRegistry.registerComponent('App:QueryBar', QueryBarComponent);
  app.appRegistry.registerAction('QueryAction', QueryAction);
  app.appRegistry.registerStore('QueryStore', QueryStore);
}

/**
 * Deactivate all the components in the Query Bar package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('App:QueryBar');
  app.appRegistry.deregisterAction('QueryAction');
  app.appRegistry.deregisterStore('QueryStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
