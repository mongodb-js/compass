import { onActivated } from './stores';
import CompassSchemaValidation from './components/compass-schema-validation';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { DataServiceLocator } from '@mongodb-js/compass-connections/provider';
import { dataServiceLocator } from '@mongodb-js/compass-connections/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';

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
    logger: createLoggerAndTelemetryLocator('COMPASS-SCHEMA-VALIDATION-UI'),
  }
);
export const CompassSchemaValidationPlugin = {
  name: 'Validation',
  component: CompassSchemaValidationHadronPlugin,
};
