import {
  CollectionStore,
  // FieldStore,
  InstanceStore,
  NamespaceStore
} from 'stores';
/**
 * Activate all the components in the App Stores package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  appRegistry.registerStore('App.NamespaceStore', NamespaceStore);
  appRegistry.registerStore('App.InstanceStore', InstanceStore);
  appRegistry.registerStore('App.CollectionStore', CollectionStore);
  // appRegistry.registerStore('Field.Store', FieldStore);
}

/**
 * Deactivate all the components in the App Stores package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterStore('App.NamespaceStore');
  appRegistry.deregisterStore('App.InstanceStore');
  appRegistry.deregisterStore('App.CollectionStore');
  // app.appRegistry.deregisterStore('Field.Store');
}

export default {
  CollectionStore
};
export { activate, deactivate };
