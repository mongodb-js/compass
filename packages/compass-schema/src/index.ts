import type { DataServiceLocator } from 'mongodb-data-service/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';

import CompassSchema from './components/compass-schema';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { DataService } from './stores/store';
import { activateSchemaPlugin } from './stores/store';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';

function activate() {
  // no-op
}

function deactivate() {
  // no-op
}

export const CompassSchemaHadronPlugin = registerHadronPlugin<
  Pick<CollectionTabPluginMetadata, 'namespace'>,
  {
    dataService: () => DataService;
    loggerAndTelemetry: () => LoggerAndTelemetry;
    preferences: () => PreferencesAccess;
  }
>(
  {
    name: 'CompassSchemaPlugin',
    component: CompassSchema as React.FunctionComponent /* reflux store */,
    activate: activateSchemaPlugin,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<
      'sample' | 'isCancelError'
    >,
    loggerAndTelemetry: createLoggerAndTelemetryLocator('COMPASS-SCHEMA-UI'),
    preferences: preferencesLocator,
  }
);
export const CompassSchemaPlugin = {
  name: 'Schema',
  component: CompassSchemaHadronPlugin,
};

export { activate, deactivate };
export { default as metadata } from '../package.json';
