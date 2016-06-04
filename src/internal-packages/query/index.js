const app = require('ampersand-app');
const QueryBar = require('./lib/component');

/**
 * Activate all the components in the Query Bar package.
 */
function activate() {
  app.componentRegistry.register(QueryBar, { role: 'App:QueryBar' });
}

/**
 * Deactivate all the components in the Query Bar package.
 */
function deactivate() {
  app.componentRegistry.deregister(QueryBar);
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
