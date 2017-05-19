const app = require('hadron-app');
const HomeComponent = require('./lib/component');
const HomeActions = require('./lib/action');

/**
 * Activate all the components in the Collection package.
 */
function activate(appRegistry) {
  appRegistry.registerComponent('Home.Home', HomeComponent);
  appRegistry.registerAction('Home.Actions', HomeActions);
}

/**
 * Deactivate all the components in the Collection package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Home.Home');
  app.appRegistry.deregisterAction('Home.Actions');
}

module.exports = HomeComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
