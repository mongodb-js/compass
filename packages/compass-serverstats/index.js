const app = require('ampersand-app');
const CompassServerstatsComponent = require('./lib/components');
const CompassServerstatsActions = require('./lib/actions');
const CompassServerstatsStore = require('./lib/stores');

/**
 * Activate all the components in the Compass Serverstats package.
 */
function activate() {
  app.appRegistry.registerComponent('App:CompassServerstats', CompassServerstatsComponent);
  app.appRegistry.registerAction('CompassServerstatsActions', CompassServerstatsActions);
  app.appRegistry.registerStore('CompassServerstatsStore', CompassServerstatsStore);
}

/**
 * Deactivate all the components in the Compass Serverstats package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('App:CompassServerstats');
  app.appRegistry.deregisterAction('CompassServerstatsActions');
  app.appRegistry.deregisterStore('CompassServerstatsStore');
}

module.exports = CompassServerstatsComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
