const DeploymentAwarenessComponent = require('./lib/components');
const DeploymentAwarenessActions = require('./lib/actions');
const DeploymentAwarenessStore = require('./lib/stores');
const WriteButton = require('./lib/components/write-button');
const WriteStateStore = require('./lib/stores/write-state-store');
const ReadStateStore = require('./lib/stores/read-state-store');
const TopologyType = require('./lib/models/topology-type');
const ServerType = require('./lib/models/server-type');

/**
 * The base plugin key.
 */
const BASE = 'DeploymentAwareness';

/**
 * Write button name.
 */
const WRITE_BUTTON = `${BASE}.WriteButton`;

/**
 * The actions name.
 */
const ACTIONS = `${BASE}.Actions`;

/**
 * The store name.
 */
const STORE = `${BASE}.Store`;

/**
 * The write state store name.
 */
const WRITE_STATE_STORE = `${BASE}.WriteStateStore`;

/**
 * The read state store name.
 */
const READ_STATE_STORE = `${BASE}.ReadStateStore`;

/**
 * A sample role for the component.
 */
const ROLE = {
  name: BASE,
  component: DeploymentAwarenessComponent,
  alignment: 'left'
};

/**
 * Header item constant.
 */
const HEADER_ITEM = 'Header.Item';

/**
 * Activate all the components in the Deployment Awareness package.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
function activate(appRegistry) {
  appRegistry.registerRole(HEADER_ITEM, ROLE);
  appRegistry.registerComponent(WRITE_BUTTON, WriteButton);
  appRegistry.registerAction(ACTIONS, DeploymentAwarenessActions);
  appRegistry.registerStore(STORE, DeploymentAwarenessStore);
  appRegistry.registerStore(WRITE_STATE_STORE, WriteStateStore);
  appRegistry.registerStore(READ_STATE_STORE, ReadStateStore);
}

/**
 * Deactivate all the components in the Deployment Awareness package.
 */
function deactivate() {
  global.hadronApp.appRegistry.deregisterRole(HEADER_ITEM, ROLE);
  global.hadronApp.appRegistry.deregisterComponent(WRITE_BUTTON);
  global.hadronApp.appRegistry.deregisterAction(ACTIONS);
  global.hadronApp.appRegistry.deregisterStore(STORE);
  global.hadronApp.appRegistry.deregisterStore(WRITE_STATE_STORE);
  global.hadronApp.appRegistry.deregisterStore(READ_STATE_STORE);
}

module.exports = DeploymentAwarenessComponent;
module.exports.WriteButton = WriteButton;
module.exports.WriteStateStore = WriteStateStore;
module.exports.ReadStateStore = ReadStateStore;
module.exports.TopologyType = TopologyType;
module.exports.ServerType = ServerType;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
