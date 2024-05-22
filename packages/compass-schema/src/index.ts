import {
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';

import CompassSchema from './components/compass-schema';
import { registerHadronPlugin } from 'hadron-app-registry';
import { activateSchemaPlugin } from './stores/store';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { fieldStoreServiceLocator } from '@mongodb-js/compass-field-store';
import { queryBarServiceLocator } from '@mongodb-js/compass-query-bar';

export const CompassSchemaHadronPlugin = registerHadronPlugin(
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
    queryBar: queryBarServiceLocator,
  }
);
export const CompassSchemaPlugin = {
  name: 'Schema' as const,
  component: CompassSchemaHadronPlugin,
};
