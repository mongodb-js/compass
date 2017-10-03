const app = require('hadron-app');
const HomeComponent = require('./lib/component');
const HomeStore = require('./lib/store');

const WORKSPACE_ROLE = {
  component: HomeComponent
};

/**
 * Activate all the components in the Collection package.
 */
function activate(appRegistry) {
  appRegistry.registerRole('Application.Workspace', WORKSPACE_ROLE);
  appRegistry.registerComponent('Home.Home', HomeComponent);
  appRegistry.registerStore('Home.HomeStore', HomeStore);
}

/**
 * Deactivate all the components in the Collection package.
 */
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Application.Workspace', WORKSPACE_ROLE);
  appRegistry.deregisterComponent('Home.Home');
  appRegistry.deregisterStore('Home.HomeStore');
}

module.exports = HomeComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
