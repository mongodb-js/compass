const app = require('hadron-app');
const ServerVersionComponent = require('./lib/components');
const ServerVersionStore = require('./lib/stores');

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'ServerVersion',
  alignment: 'right',
  order: 10,
  component: ServerVersionComponent
};

/**
 * Activate all the components in the collection stats package.
 * @param{object} appRegistry   the app registry
 * @see https://github.com/mongodb-js/hadron-app-registry
 */
function activate(appRegistry) {
  appRegistry.registerRole('Header.Item', ROLE);
  appRegistry.registerStore('ServerVersion.Store', ServerVersionStore);
}

/**
 * Deactivate all the components in the Server Version package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('Header.Item', ROLE);
  app.appRegistry.deregisterStore('ServerVersion.Store');
}

module.exports = ServerVersionComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
