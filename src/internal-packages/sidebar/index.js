const app = require('ampersand-app');
const CompassSidebarComponent = require('./lib/components');
const CompassSidebarActions = require('./lib/actions');
const CompassSidebarStore = require('./lib/stores');

/**
 * Activate all the components in the Compass Sidebar package.
 */
function activate() {
  app.appRegistry.registerComponent('App:CompassSidebar', CompassSidebarComponent);
  app.appRegistry.registerAction('CompassSidebarActions', CompassSidebarActions);
  app.appRegistry.registerStore('CompassSidebarStore', CompassSidebarStore);
}

/**
 * Deactivate all the components in the Compass Sidebar package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('App:CompassSidebar');
  app.appRegistry.deregisterAction('CompassSidebarActions');
  app.appRegistry.deregisterStore('CompassSidebarStore');
}

module.exports = CompassSidebarComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
