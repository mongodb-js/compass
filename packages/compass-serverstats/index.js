const app = require('hadron-app');
const PerformanceComponent = require('./lib/components/');

/**
 * The instance tab definition.
 */
const INSTANCE_TAB_ROLE = {
  component: PerformanceComponent,
  name: "PERFORMANCE",
  order: 2
};

/**
 * Activate all the components in the RTSS package.
 */
function activate() {
  app.appRegistry.registerRole('Instance.Tab', INSTANCE_TAB_ROLE);
}

/**
 * Deactivate all the components in the RTSS package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('Instance.Tab', INSTANCE_TAB_ROLE);
}

module.exports.d3 = require('./lib/d3/');
module.exports.activate = activate;
module.exports.deactivate = deactivate;
