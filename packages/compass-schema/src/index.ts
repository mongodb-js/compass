import React from 'react';
import {
  connectionInfoRefLocator,
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';

import CompassSchema from './components/compass-schema';
import { registerHadronPlugin } from 'hadron-app-registry';
import { activateSchemaPlugin } from './stores/store';
import type { RequiredDataServiceProps } from './stores/store';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { fieldStoreServiceLocator } from '@mongodb-js/compass-field-store';
import { queryBarServiceLocator } from '@mongodb-js/compass-query-bar';
import { SchemaTabTitle } from './plugin-title';

const CompassSchemaHadronPlugin = registerHadronPlugin(
  {
    name: 'CompassSchemaPlugin',
    component: function SchemaProvider({ children, ...props }) {
      return React.createElement(
        React.Fragment,
        null,
        // Cloning children with props is a workaround for reflux store.
        React.isValidElement(children)
          ? React.cloneElement(children, props)
          : null
      );
    },
    activate: activateSchemaPlugin,
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
  provider: CompassSchemaHadronPlugin,
  content: CompassSchema as React.FunctionComponent /* reflux store */,
  header: SchemaTabTitle,
};

export * from './modules/schema-analysis';
