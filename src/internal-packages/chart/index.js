const app = require('hadron-app');
const ChartActions = require('./lib/actions');
const ChartStore = require('./lib/store');
const Chart = require('./lib/components/chart');
const ChartBuilder = require('./lib/components/index');

/**
 * The collection tab role for the chart component.
 */
const COLLECTION_TAB_ROLE = {
  component: ChartBuilder,
  name: 'CHARTS',
  order: 6
};

/**
 * Activate all the components in the Chart package.
 */
function activate() {
  app.appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.registerAction('Chart.Actions', ChartActions);
  app.appRegistry.registerStore('Chart.Store', ChartStore);
  app.appRegistry.registerComponent('Chart.Chart', Chart);
  app.appRegistry.registerComponent('Chart.ChartBuilder', ChartBuilder);
}

/**
 * Deactivate all the components in the Chart package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.deregisterAction('Chart.Actions');
  app.appRegistry.deregisterStore('Chart.Store');
  app.appRegistry.deregisterComponent('Chart.Chart');
  app.appRegistry.deregisterComponent('Chart.ChartBuilder');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
