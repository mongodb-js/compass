const app = require('hadron-app');

const InstanceActions = require('./lib/actions/instance-actions');
const InstanceStore = require('./lib/stores/instance-store');
const CollectionStore = require('./lib/stores/collection-store');
const FieldStore = require('./lib/stores/field-store');
const { NamespaceStore } = require('hadron-reflux-store');

/**
 * Activate all the components in the Compass Sidebar package.
 */
function activate() {
  app.appRegistry.registerAction('App.InstanceActions', InstanceActions);
  app.appRegistry.registerStore('App.InstanceStore', InstanceStore);
  app.appRegistry.registerStore('App.CollectionStore', CollectionStore);
  app.appRegistry.registerStore('App.NamespaceStore', NamespaceStore);
  app.appRegistry.registerStore('Schema.FieldStore', FieldStore);
}

/**
 * Deactivate all the components in the Compass Sidebar package.
 */
function deactivate() {
  app.appRegistry.deregisterAction('App.InstanceActions');
  app.appRegistry.deregisterStore('App.InstanceStore');
  app.appRegistry.deregisterStore('App.CollectionStore');
  app.appRegistry.deregisterStore('App.NamespaceStore');
  app.appRegistry.deregisterStore('Schema.FieldStore');
}

module.exports.activate = activate;
module.exports.deactivate = deactivate;
