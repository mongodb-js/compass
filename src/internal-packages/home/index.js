const app = require('ampersand-app');
const HomeComponent = require('./lib/components');

/**
 * Activate all the components in the Collection package.
 */
function activate() {
  app.appRegistry.registerComponent('Home.Home', HomeComponent);
}

/**
 * Deactivate all the components in the Collection package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Home.Home');
}

module.exports = HomeComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
