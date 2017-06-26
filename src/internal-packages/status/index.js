const app = require('hadron-app');
const StatusComponent = require('./lib/component');
const StatusAction = require('./lib/action');
const StatusStore = require('./lib/store');

/**
 * Activate all the components in the collection stats package.
 * @param{object} appRegistry   the app registry
 * @see https://github.com/mongodb-js/hadron-app-registry
 */
function activate(appRegistry) {
  appRegistry.registerComponent('Status.ProgressBar', StatusComponent);
  appRegistry.registerAction('Status.Actions', StatusAction);
  appRegistry.registerStore('Status.Store', StatusStore);
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
