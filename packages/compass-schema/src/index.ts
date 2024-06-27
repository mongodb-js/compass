import {
  connectionInfoAccessLocator,
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';

import CompassSchema from './components/compass-schema';
import { registerHadronPlugin } from 'hadron-app-registry';
import { activateSchemaPlugin } from './stores/store';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { createTelemetryLocator } from '@mongodb-js/compass-telemetry/provider';
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
    logger: createLoggerLocator('COMPASS-SCHEMA-UI'),
    track: createTelemetryLocator(),
    preferences: preferencesLocator,
    fieldStoreService: fieldStoreServiceLocator,
    queryBar: queryBarServiceLocator,
    connectionInfoAccess: connectionInfoAccessLocator,
  }
);
export const CompassSchemaPlugin = {
  name: 'Schema' as const,
  component: CompassSchemaHadronPlugin,
};
