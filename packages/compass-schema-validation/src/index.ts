import { onActivated } from './stores';
import CompassSchemaValidation from './components/compass-schema-validation';
import { registerHadronPlugin } from 'hadron-app-registry';
import {
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { createConnectionScopedTelemetryLocator } from '@mongodb-js/compass-connections/dist/connection-scoped-telemetry';

export const CompassSchemaValidationHadronPlugin = registerHadronPlugin(
  {
    name: 'CompassSchemaValidationPlugin',
    component: CompassSchemaValidation,
    activate: onActivated,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<
      'aggregate' | 'collectionInfo' | 'updateCollection'
    >,
    instance: mongoDBInstanceLocator,
    preferences: preferencesLocator,
    logger: createLoggerLocator('COMPASS-SCHEMA-VALIDATION-UI'),
    track: createConnectionScopedTelemetryLocator(),
  }
);
export const CompassSchemaValidationPlugin = {
  name: 'Validation' as const,
  component: CompassSchemaValidationHadronPlugin,
};
