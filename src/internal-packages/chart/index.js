const app = require('hadron-app');
const ChartActions = require('./lib/actions');
const ChartStore = require('./lib/store');
const Chart = require('./lib/components/chart');
const ChartBuilder = require('./lib/components/index');

const BarChartType = require('./lib/chart-types/bar.json');
const ScatterPlotType = require('./lib/chart-types/scatter.json');
const LineChartType = require('./lib/chart-types/line.json');
const AreaChartType = require('./lib/chart-types/area.json');

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
 *
 * @param {Object} appRegistry   the app registry
 */
function activate(appRegistry) {
  appRegistry.registerRole('Collection.Tab', COLLECTION_TAB_ROLE);
  appRegistry.registerRole('Chart.Type', BarChartType);
  appRegistry.registerRole('Chart.Type', ScatterPlotType);
  appRegistry.registerRole('Chart.Type', LineChartType);
  appRegistry.registerRole('Chart.Type', AreaChartType);
  appRegistry.registerAction('Chart.Actions', ChartActions);
  appRegistry.registerStore('Chart.Store', ChartStore);
  appRegistry.registerComponent('Chart.Chart', Chart);
  appRegistry.registerComponent('Chart.ChartBuilder', ChartBuilder);
}

/**
 * Deactivate all the components in the Chart package.
 */
function deactivate() {
  app.appRegistry.deregisterRole('Collection.Tab', COLLECTION_TAB_ROLE);
  app.appRegistry.deregisterRole('Chart.Type', BarChartType);
  app.appRegistry.deregisterRole('Chart.Type', ScatterPlotType);
  app.appRegistry.deregisterRole('Chart.Type', LineChartType);
  app.appRegistry.deregisterRole('Chart.Type', AreaChartType);
  app.appRegistry.deregisterAction('Chart.Actions');
  app.appRegistry.deregisterStore('Chart.Store');
  app.appRegistry.deregisterComponent('Chart.Chart');
  app.appRegistry.deregisterComponent('Chart.ChartBuilder');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
