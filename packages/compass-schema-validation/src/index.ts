import { onActivated } from './stores';
import CompassSchemaValidation from './components/compass-schema-validation';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { DataServiceLocator } from 'mongodb-data-service/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';

function activate() {
  // no-op
}

function deactivate() {
  // no-op
}

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

export { activate, deactivate };
export { default as metadata } from '../package.json';
