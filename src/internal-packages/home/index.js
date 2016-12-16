const app = require('ampersand-app');
const HomeComponent = require('./lib/components');
const HomeActions = require('./lib/actions');

/**
 * Activate all the components in the Collection package.
 */
function activate() {
  app.appRegistry.registerComponent('Home.Home', HomeComponent);
  app.appRegistry.registerAction('Home.Actions', HomeActions);
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
