const app = require('ampersand-app');
const QueryBar = require('./lib/component');

/**
 * Activate all the components in the Query Bar package.
 */
function activate() {
  app.appRegistry.registerComponent('App:QueryBar', QueryBar);
}

/**
 * Deactivate all the components in the Query Bar package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('App:QueryBar');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
