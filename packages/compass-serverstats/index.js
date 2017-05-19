const PerformanceComponent = require('./lib/components/');
const ServerStatsStore = require('./lib/stores/server-stats-graphs-store');
const CurrentOpStore = require('./lib/stores/current-op-store');
const TopStore = require('./lib/stores/top-store');

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
function activate(appRegistry) {
  appRegistry.registerRole('Instance.Tab', INSTANCE_TAB_ROLE);
  appRegistry.registerStore('RTSS.ServerStatsStore', ServerStatsStore);
  appRegistry.registerStore('RTSS.CurrentOpStore', CurrentOpStore);
  appRegistry.registerStore('RTSS.TopStore', TopStore);
}

/**
 * Deactivate all the components in the RTSS package.
 */
function deactivate() {
  global.hadronApp.appRegistry.deregisterRole('Instance.Tab', INSTANCE_TAB_ROLE);
  global.hadronApp.appRegistry.deregisterStore('RTSS.ServerStatsStore', ServerStatsStore);
  global.hadronApp.appRegistry.deregisterStore('RTSS.CurrentOpStore', CurrentOpStore);
  global.hadronApp.appRegistry.deregisterStore('RTSS.TopStore', TopStore);
}

module.exports.d3 = require('./lib/d3/');
module.exports.activate = activate;
module.exports.deactivate = deactivate;
