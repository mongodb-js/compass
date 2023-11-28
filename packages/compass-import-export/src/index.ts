import { registerHadronPlugin } from 'hadron-app-registry';
import {
  dataServiceLocator,
  type DataServiceLocator,
} from 'mongodb-data-service/provider';
import ImportPluginComponent from './import-plugin';
import { activatePlugin as activateImportPlugin } from './stores/import-store';
import ExportPluginComponent from './export-plugin';
import { activatePlugin as activateExportPlugin } from './stores/export-store';

/**
 * The import plugin.
 */
export const ImportPlugin = registerHadronPlugin(
  {
    name: 'Import',
    component: ImportPluginComponent,
    activate: activateImportPlugin,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<
      'isConnected' | 'bulkWrite' | 'insertOne'
    >,
  }
);

/**
 * The export plugin.
 */
export const ExportPlugin = registerHadronPlugin(
  {
    name: 'Export',
    component: ExportPluginComponent,
    activate: activateExportPlugin,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<
      'findCursor' | 'aggregateCursor'
    >,
  }
);

function activate(): void {
  // noop
}

function deactivate(): void {
  // noop
}

export { activate, deactivate };
export { default as metadata } from '../package.json';
