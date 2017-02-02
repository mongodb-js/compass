const app = require('ampersand-app');
const ChartActions = require('./lib/actions');
const ChartStore = require('./lib/store');

/**
 * Activate all the components in the Chart package.
 */
function activate() {
  app.appRegistry.registerAction('Chart.Actions', ChartActions);
  app.appRegistry.registerStore('Chart.Store', ChartStore);
}

/**
 * Deactivate all the components in the Chart package.
 */
function deactivate() {
  app.appRegistry.deregisterAction('Chart.Actions');
  app.appRegistry.deregisterStore('Chart.Store');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
