import React from 'react';
import { onActivated } from './stores';
import { CompassSchemaValidation } from './components/compass-schema-validation';
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
import { SchemaValidationTabTitle } from './plugin-title';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { RequiredDataServiceProps } from './modules';

const CompassSchemaValidationHadronPlugin = registerHadronPlugin(
  {
    name: 'CompassSchemaValidationPlugin',
    component: function SchemaValidationsProvider({ children }) {
      return React.createElement(React.Fragment, null, children);
    },
    activate: onActivated,
  },
  {
    dataService:
      dataServiceLocator as DataServiceLocator<RequiredDataServiceProps>,
    connectionInfoRef: connectionInfoRefLocator,
    instance: mongoDBInstanceLocator,
    preferences: preferencesLocator,
    logger: createLoggerLocator('COMPASS-SCHEMA-VALIDATION-UI'),
    track: telemetryLocator,
    workspaces: workspacesServiceLocator,
  }
);
export const CompassSchemaValidationPlugin = {
  name: 'Validation' as const,
  provider: CompassSchemaValidationHadronPlugin,
  content: CompassSchemaValidation,
  header: SchemaValidationTabTitle,
};
