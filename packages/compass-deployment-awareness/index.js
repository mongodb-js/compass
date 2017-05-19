const DeploymentAwarenessComponent = require('./lib/components');
const DeploymentAwarenessActions = require('./lib/actions');
const DeploymentAwarenessStore = require('./lib/stores');

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'DeploymentAwareness',
  component: DeploymentAwarenessComponent,
  alignment: 'right'
};

/**
 * Activate all the components in the Deployment Awareness package.
 */
function activate(appRegistry) {
  appRegistry.registerRole('Header.Item', ROLE);
  appRegistry.registerAction('DeploymentAwareness.Actions', DeploymentAwarenessActions);
  appRegistry.registerStore('DeploymentAwareness.Store', DeploymentAwarenessStore);
}

/**
 * Deactivate all the components in the Deployment Awareness package.
 */
function deactivate() {
  global.hadronApp.appRegistry.deregisterRole('Header.Item', ROLE);
  global.hadronApp.appRegistry.deregisterAction('DeploymentAwareness.Actions');
  global.hadronApp.appRegistry.deregisterStore('DeploymentAwareness.Store');
}

module.exports = DeploymentAwarenessComponent;
module.exports.activate = activate;
module.exports.deactivate = deactivate;
