import {
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';

import CompassSchema from './components/compass-schema';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { DataService } from './stores/store';
import { activateSchemaPlugin } from './stores/store';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import {
  type FieldStoreService,
  fieldStoreServiceLocator,
} from '@mongodb-js/compass-field-store';

export const CompassSchemaHadronPlugin = registerHadronPlugin<
  Pick<CollectionTabPluginMetadata, 'namespace'>,
  {
    dataService: () => DataService;
    loggerAndTelemetry: () => LoggerAndTelemetry;
    preferences: () => PreferencesAccess;
    fieldStoreService: () => FieldStoreService;
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
    fieldStoreService: fieldStoreServiceLocator,
  }
);
export const CompassSchemaPlugin = {
  name: 'Schema' as const,
  component: CompassSchemaHadronPlugin,
};
