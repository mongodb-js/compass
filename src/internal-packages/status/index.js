const app = require('ampersand-app');
const StatusComponent = require('./lib/component');
const StatusAction = require('./lib/action');
const StatusStore = require('./lib/store');

/**
 * Activate all the components in the Status package.
 */
function activate() {
  app.appRegistry.registerComponent('Status.ProgressBar', StatusComponent);
  app.appRegistry.registerAction('Status.Actions', StatusAction);
  app.appRegistry.registerStore('Status.Store', StatusStore);
}

/**
 * Deactivate all the components in the Status package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Status.ProgressBar');
  app.appRegistry.deregisterAction('Status.Actions');
  app.appRegistry.deregisterStore('Status.Store');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
