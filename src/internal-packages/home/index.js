const app = require('hadron-app');
const HomeComponent = require('./lib/component');
const HomeStore = require('./lib/store');

/**
 * Activate all the components in the collection stats package.
 * @param{object} appRegistry   the app registry
 * @see https://github.com/mongodb-js/hadron-app-registry
 */
function activate(appRegistry) {
  appRegistry.registerComponent('Home.Home', HomeComponent);
  appRegistry.registerStore('Home.HomeStore', HomeStore);
}

/**
 * Deactivate all the components in the Collection package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Home.Home');
  app.appRegistry.deregisterStore('Home.HomeStore');
}

module.exports = HomeComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
