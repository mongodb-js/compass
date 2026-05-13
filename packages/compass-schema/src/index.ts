import React from 'react';
import {
  connectionInfoRefLocator,
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';

import CompassSchema from './components/compass-schema';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { activateSchemaPlugin } from './stores/store';
import type { RequiredDataServiceProps } from './stores/store';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { fieldStoreServiceLocator } from '@mongodb-js/compass-field-store';
import { queryBarServiceLocator } from '@mongodb-js/compass-query-bar';
import { SchemaTabTitle } from './plugin-title';
import { I18nProvider, initLanguage } from './i18n';

const CompassSchemaPluginProvider = registerCompassPlugin(
  {
    name: 'CompassSchemaPlugin',
    component: function SchemaProvider({ children, ...props }) {
      return React.createElement(
        I18nProvider,
        null,
        // Cloning children with props is a workaround for reflux store.
        React.isValidElement(children)
          ? React.cloneElement(children, props)
          : null
      );
    },
    activate: (...args: Parameters<typeof activateSchemaPlugin>) => {
      initLanguage(args[1].preferences.getPreferences().language);
      return activateSchemaPlugin(...args);
    },
  },
  {
    dataService:
      dataServiceLocator as DataServiceLocator<RequiredDataServiceProps>,
    logger: createLoggerLocator('COMPASS-SCHEMA-UI'),
    track: telemetryLocator,
    preferences: preferencesLocator,
    fieldStoreService: fieldStoreServiceLocator,
    queryBar: queryBarServiceLocator,
    connectionInfoRef: connectionInfoRefLocator,
  }
);

export const CompassSchemaPlugin = {
  name: 'Schema' as const,
  provider: CompassSchemaPluginProvider,
  content: CompassSchema as React.FunctionComponent /* reflux store */,
  header: SchemaTabTitle,
};

export * from './modules/schema-analysis';
