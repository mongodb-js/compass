const app = require('hadron-app');
const SSHTunnelStatusComponent = require('./lib/components');
const SSHTunnelStatusStore = require('./lib/stores');

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'ServerVersion',
  alignment: 'left',
  order: 1,
  component: SSHTunnelStatusComponent
};

/**
 * Activate all the components in the Server Version package.
 */
function activate() {
  app.appRegistry.registerRole('Header.Item', ROLE);
  app.appRegistry.registerStore('SSHTunnelStatus.Store', SSHTunnelStatusStore);
}

/**
 * Deactivate all the components in the Server Version package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('Header.Item', ROLE);
  app.appRegistry.deregisterStore('SSHTunnelStatus.Store');
}

module.exports = SSHTunnelStatusComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
