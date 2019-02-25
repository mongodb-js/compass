import {
  CollectionStore
  // FieldStore,
  // InstanceStore,
  // NamespaceStore
} from 'stores';
/**
 * Activate all the components in the App Stores package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // appRegistry.registerAction('App.InstanceActions', InstanceActions);
  // appRegistry.registerStore('App.NamespaceStore', NamespaceStore);
  // appRegistry.registerStore('App.InstanceStore', InstanceStore);
  appRegistry.registerStore('App.CollectionStore', CollectionStore);
  // appRegistry.registerStore('Field.Store', FieldStore);
}

/**
 * Deactivate all the components in the App Stores package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  // app.appRegistry.deregisterAction('App.InstanceActions');
  // app.appRegistry.deregisterStore('App.NamespaceStore');
  // app.appRegistry.deregisterStore('App.InstanceStore');
  appRegistry.deregisterStore('App.CollectionStore');
  // app.appRegistry.deregisterStore('Field.Store');
}

export default {
  CollectionStore
};
export { activate, deactivate };
