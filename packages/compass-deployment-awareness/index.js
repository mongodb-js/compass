const DeploymentAwarenessComponent = require('./lib/components');
const DeploymentAwarenessActions = require('./lib/actions');
const DeploymentAwarenessStore = require('./lib/stores');
const DeploymentStateStore = require('./lib/stores/deployment-state-store');

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Topology',
  component: DeploymentAwarenessComponent,
  order: 3
};

/**
 * Activate all the components in the Deployment Awareness package.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
function activate(appRegistry) {
  appRegistry.registerRole('Instance.Tab', ROLE);
  appRegistry.registerAction('DeploymentAwareness.Actions', DeploymentAwarenessActions);
  appRegistry.registerStore('DeploymentAwareness.Store', DeploymentAwarenessStore);
  appRegistry.registerStore('DeploymentAwareness.DeploymentStateStore', DeploymentStateStore);
}

/**
 * Deactivate all the components in the Deployment Awareness package.
 */
function deactivate() {
  global.hadronApp.appRegistry.deregisterRole('Instance.Tab', ROLE);
  global.hadronApp.appRegistry.deregisterAction('DeploymentAwareness.Actions');
  global.hadronApp.appRegistry.deregisterStore('DeploymentAwareness.Store');
  global.hadronApp.appRegistry.deregisterStore('DeploymentAwareness.DeploymentStateStore');
}

module.exports = DeploymentAwarenessComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
