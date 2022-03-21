/* eslint-disable @typescript-eslint/no-var-requires */
const Plugin = require('./plugin').default;
const ImportPlugin = require('./import-plugin').default;
const ExportPlugin = require('./export-plugin').default;
const exportStore = require('./stores/export-store').default;
const importStore = require('./stores/import-store').default;

import type AppRegistry from 'hadron-app-registry';

/**
 * The import plugin.
 */
const IMPORT_ROLE = {
  name: 'Import',
  component: ImportPlugin,
};

/**
 * The export plugin.
 */
const EXPORT_ROLE = {
  name: 'Export',
  component: ExportPlugin,
};

/**
 * Activate all the components in the Import Export package.
 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Global.Modal', EXPORT_ROLE);
  appRegistry.registerStore('ExportModal.Store', exportStore);
  appRegistry.registerRole('Global.Modal', IMPORT_ROLE);
  appRegistry.registerStore('ImportModal.Store', importStore);
}

/**
 * Deactivate all the components in the Import Export package.
 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Global.Modal', EXPORT_ROLE);
  appRegistry.deregisterStore('ExportModal.Store');
  appRegistry.deregisterRole('Global.Modal', IMPORT_ROLE);
  appRegistry.deregisterStore('ImportModal.Store');
}

export default Plugin;
export { activate, deactivate, ImportPlugin, ExportPlugin };
export { default as metadata } from '../package.json';
