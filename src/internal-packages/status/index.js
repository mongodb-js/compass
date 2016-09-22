const app = require('ampersand-app');
const StatusComponent = require('./lib/component');
const StatusAction = require('./lib/action');
const StatusStore = require('./lib/store');
/**
 * Activate all the components in the CRUD package.
 */
function activate() {
  app.appRegistry.registerComponent('App:Status', StatusComponent);
  app.appRegistry.registerAction('StatusAction', StatusAction);
  app.appRegistry.registerStore('StatusStore', StatusStore);
}

/**
 * Deactivate all the components in the CRUD package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('App:Status');
  app.appRegistry.deregisterAction('StatusAction');
  app.appRegistry.deregisterStore('StatusStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
