const app = require('ampersand-app');
const GlossaryComponent = require('./lib/components');
const GlossaryActions = require('./lib/actions');
const GlossaryStore = require('./lib/stores');

/**
 * Activate all the components in the Compass Sidebar package.
 */
function activate() {
  app.appRegistry.registerComponent('Glossary.Component', GlossaryComponent);
  app.appRegistry.registerAction('Glossary.Actions', GlossaryActions);
  app.appRegistry.registerStore('Glossary.Store', GlossaryStore);
}

/**
 * Deactivate all the components in the Compass Sidebar package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('Glossary.Component');
  app.appRegistry.deregisterAction('Glossary.Actions');
  app.appRegistry.deregisterStore('Glossary.Store');
}

module.exports = GlossaryComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
