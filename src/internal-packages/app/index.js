const app = require('hadron-app');

const HadronTooltip = require('./lib/components/hadron-tooltip');
const InstanceActions = require('./lib/actions/instance-actions');
const InstanceStore = require('./lib/stores/instance-store');
const CollectionStore = require('./lib/stores/collection-store');

/**
 * Activate all the components in the Compass Sidebar package.
 */
function activate() {
  app.appRegistry.registerComponent('App.HadronTooltip', HadronTooltip);
  app.appRegistry.registerAction('App.InstanceActions', InstanceActions);
  app.appRegistry.registerStore('App.InstanceStore', InstanceStore);
  app.appRegistry.registerStore('App.CollectionStore', CollectionStore);
}

/**
 * Deactivate all the components in the Compass Sidebar package.
 */
function deactivate() {
  app.appRegistry.deregisterComponent('App.HadronTooltip');
  app.appRegistry.deregisterAction('App.InstanceActions');
  app.appRegistry.deregisterStore('App.InstanceStore');
  app.appRegistry.deregisterStore('App.CollectionStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
