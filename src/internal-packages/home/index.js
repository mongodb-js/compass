const app = require('hadron-app');
const HomeComponent = require('./lib/component');
const HomeActions = require('./lib/action');
const HomeStore = require('./lib/store');

/**
 * Activate all the components in the Collection package.
 */
function activate(appRegistry) {
  appRegistry.registerComponent('Home.Home', HomeComponent);
  appRegistry.registerAction('Home.Actions', HomeActions);
  appRegistry.registerStore('Home.HomeStore', HomeStore);
}

/**
 * Deactivate all the components in the Collection package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Home.Home');
  app.appRegistry.deregisterAction('Home.Actions');
  app.appRegistry.deregisterStore('Home.HomeStore', HomeStore);
}

module.exports = HomeComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
