const app = require('ampersand-app');
const ExplainComponent = require('./lib/components');
const ExplainActions = require('./lib/actions');
const ExplainStore = require('./lib/stores');

/**
 * Activate all the components in the  Explain package.
 */
function activate() {
  app.appRegistry.registerComponent('Explain.ExplainPlan', ExplainComponent);
  app.appRegistry.registerAction('Explain.Actions', ExplainActions);
  app.appRegistry.registerStore('Explain.Store', ExplainStore);
}

/**
 * Deactivate all the components in the  Explain package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Explain.ExplainPlan');
  app.appRegistry.deregisterAction('Explain.Actions');
  app.appRegistry.deregisterStore('Explain.Store');
}

module.exports = ExplainComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
