import React from 'react';
import { onActivated } from './stores';
import { CompassSchemaValidation } from './components/compass-schema-validation';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
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
import { I18nProvider, initLanguage } from './i18n';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { RequiredDataServiceProps } from './modules';

const CompassSchemaValidationPluginProvider = registerCompassPlugin(
  {
    name: 'CompassSchemaValidationPlugin',
    component: function SchemaValidationsProvider({ children }) {
      return React.createElement(I18nProvider, null, children);
    },
    activate: (...args: Parameters<typeof onActivated>) => {
      initLanguage(args[1].preferences.getPreferences().language);
      return onActivated(...args);
    },
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
  provider: CompassSchemaValidationPluginProvider,
  content: CompassSchemaValidation,
  header: SchemaValidationTabTitle,
};
