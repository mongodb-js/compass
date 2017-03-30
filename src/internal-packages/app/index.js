const app = require('hadron-app');

const HadronTooltip = require('./lib/components/hadron-tooltip');
const StoreConnector = require('./lib/components/store-connector');
const SortableTable = require('./lib/components/sortable-table');
const TabNavBar = require('./lib/components/tab-nav-bar');
const StatusRow = require('./lib/components/status-row');
const InstanceActions = require('./lib/actions/instance-actions');
const InstanceStore = require('./lib/stores/instance-store');
const CollectionStore = require('./lib/stores/collection-store');
const ModalStatusMessage = require('./lib/components/modal-status-message');

/**
 * Activate all the components in the Compass Sidebar package.
 */
function activate() {
  app.appRegistry.registerComponent('App.HadronTooltip', HadronTooltip);
  app.appRegistry.registerComponent('App.StoreConnector', StoreConnector);
  app.appRegistry.registerComponent('App.SortableTable', SortableTable);
  app.appRegistry.registerComponent('App.ModalStatusMessage', ModalStatusMessage);
  app.appRegistry.registerComponent('App.TabNavBar', TabNavBar);
  app.appRegistry.registerComponent('App.StatusRow', StatusRow);
  app.appRegistry.registerAction('App.InstanceActions', InstanceActions);
  app.appRegistry.registerStore('App.InstanceStore', InstanceStore);
  app.appRegistry.registerStore('App.CollectionStore', CollectionStore);
}

/**
 * Deactivate all the components in the Compass Sidebar package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('App.HadronTooltip');
  app.appRegistry.deregisterComponent('App.StoreConnector');
  app.appRegistry.deregisterComponent('App.SortableTable');
  app.appRegistry.deregisterComponent('App.ModalStatusMessage');
  app.appRegistry.deregisterComponent('App.TabNavBar');
  app.appRegistry.deregisterComponent('App.StatusRow');
  app.appRegistry.deregisterAction('App.InstanceActions');
  app.appRegistry.deregisterStore('App.InstanceStore');
  app.appRegistry.deregisterStore('App.CollectionStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
