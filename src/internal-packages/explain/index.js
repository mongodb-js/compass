const app = require('hadron-app');
const ExplainComponent = require('./lib/components');
const ExplainActions = require('./lib/actions');
const ExplainStore = require('./lib/stores');

/**
 * The collection tab role for the explain component.
 */
const COLLECTION_TAB_ROLE = {
  component: ExplainComponent,
  name: 'EXPLAIN PLAN',
  order: 3
};

/**
 * Activate all the components in the  Explain package.
 */
function activate() {
  app.appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.registerAction('Explain.Actions', ExplainActions);
  app.appRegistry.registerStore('Explain.Store', ExplainStore);
}

/**
 * Deactivate all the components in the  Explain package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.deregisterAction('Explain.Actions');
  app.appRegistry.deregisterStore('Explain.Store');
}

module.exports = ExplainComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
