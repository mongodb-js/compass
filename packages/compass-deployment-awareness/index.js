const DeploymentAwarenessComponent = require('./lib/components');
const DeploymentAwarenessActions = require('./lib/actions');
const DeploymentAwarenessStore = require('./lib/stores');
const WriteButton = require('./lib/components/write-button');
const WriteStateStore = require('./lib/stores/write-state-store');
const ReadStateStore = require('./lib/stores/read-state-store');
const TopologyType = require('./lib/models/topology-type');
const ServerType = require('./lib/models/server-type');

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'DeploymentAwareness',
  component: DeploymentAwarenessComponent,
  alignment: 'left'
};

/**
 * Activate all the components in the Deployment Awareness package.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
function activate(appRegistry) {
  appRegistry.registerRole('Header.Item', ROLE);
  appRegistry.registerComponent('DeploymentAwareness.WriteButton', WriteButton);
  appRegistry.registerAction('DeploymentAwareness.Actions', DeploymentAwarenessActions);
  appRegistry.registerStore('DeploymentAwareness.Store', DeploymentAwarenessStore);
  appRegistry.registerStore('DeploymentAwareness.WriteStateStore', WriteStateStore);
  appRegistry.registerStore('DeploymentAwareness.ReadStateStore', ReadStateStore);
}

/**
 * Deactivate all the components in the Deployment Awareness package.
 */
function deactivate() {
  global.hadronApp.appRegistry.deregisterRole('Header.Item', ROLE);
  global.hadronApp.appRegistry.deregisterComponent('DeploymentAwareness.WriteButton');
  global.hadronApp.appRegistry.deregisterAction('DeploymentAwareness.Actions');
  global.hadronApp.appRegistry.deregisterStore('DeploymentAwareness.Store');
  global.hadronApp.appRegistry.deregisterStore('DeploymentAwareness.WriteStateStore');
  global.hadronApp.appRegistry.deregisterStore('DeploymentAwareness.ReadStateStore');
}

module.exports = DeploymentAwarenessComponent;
module.exports.WriteButton = WriteButton;
module.exports.WriteStateStore = WriteStateStore;
module.exports.ReadStateStore = ReadStateStore;
module.exports.TopologyType = TopologyType;
module.exports.ServerType = ServerType;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
