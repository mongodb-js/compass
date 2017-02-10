const app = require('ampersand-app');
const ClippyStore = require('./store');

/**
 * Activate all the components in the Query Bar package.
 */
function activate() {
  app.appRegistry.registerStore('Clippy.Store', ClippyStore);
}

/**
 * Deactivate all the components in the Query Bar package.
 */
function deactivate() {
  app.appRegistry.deregisterStore('Clippy.Store');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
