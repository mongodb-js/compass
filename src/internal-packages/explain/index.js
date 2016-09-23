const app = require('ampersand-app');
const ExplainComponent = require('./lib/components');
const ExplainActions = require('./lib/actions');
const ExplainStore = require('./lib/stores');

/**
 * Activate all the components in the  Explain package.
 */
function activate() {
  app.appRegistry.registerComponent('Collection:Explain', ExplainComponent);
  app.appRegistry.registerAction('ExplainActions', ExplainActions);
  app.appRegistry.registerStore('ExplainStore', ExplainStore);
}

/**
 * Deactivate all the components in the  Explain package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Collection:Explain');
  app.appRegistry.deregisterAction('ExplainActions');
  app.appRegistry.deregisterStore('ExplainStore');
}

module.exports = ExplainComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
