const app = require('hadron-app');

const InstanceActions = require('./lib/actions/instance-actions');
const InstanceStore = require('./lib/stores/instance-store');
const CollectionStore = require('./lib/stores/collection-store');
const FieldStore = require('./lib/stores/field-store');
const ViewSwitcher = require('./lib/components/view-switcher');
const Chart = require('./lib/components/chart');
const NamespaceStore = require('./lib/stores/namespace-store');

/**
 * Activate all the components in the Compass Sidebar package.
 *
 * @param {Object} appRegistry    app registry
 */
function activate(appRegistry) {
  appRegistry.registerStore('App.NamespaceStore', NamespaceStore);
  appRegistry.registerAction('App.InstanceActions', InstanceActions);
  appRegistry.registerStore('App.InstanceStore', InstanceStore);
  appRegistry.registerStore('App.CollectionStore', CollectionStore);
  appRegistry.registerStore('App.NamespaceStore', NamespaceStore);
  appRegistry.registerComponent('App.ViewSwitcher', ViewSwitcher);
  appRegistry.registerComponent('Chart.Chart', Chart);
  appRegistry.registerStore('Schema.FieldStore', FieldStore);
}

/**
 * Deactivate all the components in the Compass Sidebar package.
 */
function deactivate() {
  app.appRegistry.deregisterAction('App.InstanceActions');
  app.appRegistry.deregisterStore('App.InstanceStore');
  app.appRegistry.deregisterStore('App.CollectionStore');
  app.appRegistry.deregisterStore('App.NamespaceStore');
  app.appRegistry.deregisterComponent('App.ViewSwitcher');
  app.appRegistry.deregisterComponent('Chart.Chart');
  app.appRegistry.deregisterStore('Schema.FieldStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
