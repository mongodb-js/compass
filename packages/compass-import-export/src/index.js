import ImportExportPlugin from './plugin';
import ImportExportActions from 'actions';
import ImportExportStore from 'stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'ImportExport',
  component: ImportExportPlugin
};

/**
 * Activate all the components in the Import Export package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry) {
  // Register the ImportExportPlugin as a role in Compass
  //
  // Available roles are:
  //   - Instance.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Database.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - Collection.Tab: { name: <String>, component: <React.Component>, order: <Number> }
  //   - CollectionHUD.Item: { name <String>, component: <React.Component> }
  //   - Header.Item: { name: <String>, component: <React.Component>, alignment: <String> }

  appRegistry.registerRole('Header.Item', ROLE);
  appRegistry.registerAction('ImportExport.Actions', ImportExportActions);
  appRegistry.registerStore('ImportExport.Store', ImportExportStore);
}

/**
 * Deactivate all the components in the Import Export package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry) {
  appRegistry.deregisterRole('Header.Item', ROLE);
  appRegistry.deregisterAction('ImportExport.Actions');
  appRegistry.deregisterStore('ImportExport.Store');
}

export default ImportExportPlugin;
export { activate, deactivate };
