import React from 'react';
import { onActivated } from './stores';
import CompassSchemaValidation from './components/compass-schema-validation';
import { registerHadronPlugin } from 'hadron-app-registry';
import {
  connectionInfoRefLocator,
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { SchemaValidationPluginName } from './plugin-name';

const CompassSchemaValidationHadronPlugin = registerHadronPlugin(
  {
    name: 'CompassSchemaValidationPlugin',
    component: function SchemaValidationsProvider({ children, ...props }) {
      return React.isValidElement(children)
        ? React.cloneElement(children, props)
        : null;
    },
    activate: onActivated,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<
      'aggregate' | 'collectionInfo' | 'updateCollection'
    >,
    connectionInfoRef: connectionInfoRefLocator,
    instance: mongoDBInstanceLocator,
    preferences: preferencesLocator,
    logger: createLoggerLocator('COMPASS-SCHEMA-VALIDATION-UI'),
    track: telemetryLocator,
  }
);
export const CompassSchemaValidationPlugin = {
  name: 'Validation' as const,
  Provider: CompassSchemaValidationHadronPlugin,
  Content: CompassSchemaValidation,
  Header: SchemaValidationPluginName,
};
