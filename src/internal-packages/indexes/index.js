const app = require('ampersand-app');
const Indexes = require('./lib/component/indexes');
const IndexDefinition = require('./lib/component/index-definition');
const IndexDefinitionType = require('./lib/component/index-definition-type');
const Action = require('./lib/action/index-actions');

/**
 * Activate all the components in the Query Bar package.
 */
function activate() {
  app.appRegistry.registerComponent('Component::Indexes::Indexes', Indexes);
  app.appRegistry.registerComponent('Component::Indexes::IndexDefinition', IndexDefinition);
  app.appRegistry.registerComponent('Component::Indexes::IndexDefinitionType', IndexDefinitionType);
  app.appRegistry.registerAction('Action::Indexes::LoadIndexes', Action.loadIndexes);
}

/**
 * Deactivate all the components in the Query Bar package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Component::Indexes::Indexes');
  app.appRegistry.deregisterComponent('Component::Indexes::IndexDefinition');
  app.appRegistry.deregisterComponent('Component::Indexes::IndexDefinitionType');
  app.appRegistry.deregisterAction('Action::Indexes::LoadIndexes');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
