const app = require('ampersand-app');
const CompassExplainComponent = require('./lib/components');
const CompassExplainActions = require('./lib/actions');
const CompassExplainStore = require('./lib/stores');

/**
 * Activate all the components in the Compass Explain package.
 */
function activate() {
  app.appRegistry.registerComponent('Collection:CompassExplain', CompassExplainComponent);
  app.appRegistry.registerAction('CompassExplainActions', CompassExplainActions);
  app.appRegistry.registerStore('CompassExplainStore', CompassExplainStore);
}

/**
 * Deactivate all the components in the Compass Explain package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Collection:CompassExplain');
  app.appRegistry.deregisterAction('CompassExplainActions');
  app.appRegistry.deregisterStore('CompassExplainStore');
}

module.exports = CompassExplainComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
