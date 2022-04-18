const { PerformanceComponent } = require('./components');
const ServerStatsStore = require('./stores/server-stats-graphs-store');
const CurrentOpStore = require('./stores/current-op-store');
const TopStore = require('./stores/top-store');

/**
 * The instance tab definition.
 */
const INSTANCE_TAB_ROLE = {
  component: PerformanceComponent,
  name: 'Performance',
  order: 3
};

/**
 * Activate all the components in the RTSS package.
 *
 * @param{Object} appRegistry   the hadron app registry
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

module.exports.d3 = require('./d3');
module.exports.activate = activate;
module.exports.deactivate = deactivate;
module.exports.metadata = require('../package.json');
