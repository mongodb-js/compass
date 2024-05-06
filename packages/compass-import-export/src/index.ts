import { registerHadronPlugin } from 'hadron-app-registry';
import {
  connectionsManagerLocator,
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import ImportPluginComponent from './import-plugin';
import { activatePlugin as activateImportPlugin } from './stores/import-store';
import ExportPluginComponent from './export-plugin';
import { activatePlugin as activateExportPlugin } from './stores/export-store';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';

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
    connectionsManager: connectionsManagerLocator,
    workspaces: workspacesServiceLocator,
    preferences: preferencesLocator,
    logger: createLoggerAndTelemetryLocator('COMPASS-IMPORT-UI'),
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
    preferences: preferencesLocator,
    logger: createLoggerAndTelemetryLocator('COMPASS-EXPORT-UI'),
  }
);
