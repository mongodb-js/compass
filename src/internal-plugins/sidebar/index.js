const app = require('hadron-app');
const CompassSidebarComponent = require('./lib/components');
const CompassSidebarActions = require('./lib/actions');
const CompassSidebarStore = require('./lib/stores');

/**
 * Activate all the components in the Compass Sidebar package.
 */
function activate(appRegistry) {
  appRegistry.registerComponent('Sidebar.Component', CompassSidebarComponent);
  appRegistry.registerAction('Sidebar.Actions', CompassSidebarActions);
  appRegistry.registerStore('Sidebar.Store', CompassSidebarStore);
}

/**
 * Deactivate all the components in the Compass Sidebar package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Sidebar.Component');
  app.appRegistry.deregisterAction('Sidebar.Actions');
  app.appRegistry.deregisterStore('Sidebar.Store');
}

module.exports = CompassSidebarComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
