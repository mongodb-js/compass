import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import {
  activateIndexesPlugin,
  type IndexesDataServiceProps,
} from './stores/store';
import Indexes from './components/indexes/indexes';
import {
  connectionInfoRefLocator,
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import {
  collectionModelLocator,
  mongoDBInstanceLocator,
} from '@mongodb-js/compass-app-stores/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { IndexesTabTitle } from './plugin-title';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';

export const CompassIndexesHadronPlugin = registerHadronPlugin(
  {
    name: 'CompassIndexes',
    component: function IndexesProvider({ children }) {
      return React.createElement(React.Fragment, null, children);
    },
    activate: activateIndexesPlugin,
  },
  {
    dataService:
      dataServiceLocator as DataServiceLocator<IndexesDataServiceProps>,
    connectionInfoRef: connectionInfoRefLocator,
    instance: mongoDBInstanceLocator,
    logger: createLoggerLocator('COMPASS-INDEXES-UI'),
    track: telemetryLocator,
    collection: collectionModelLocator,
    atlasService: atlasServiceLocator,
    preferences: preferencesLocator,
  }
);

export const CompassIndexesPlugin = {
  name: 'Indexes' as const,
  provider: CompassIndexesHadronPlugin,
  content: Indexes as React.FunctionComponent,
  header: IndexesTabTitle as React.FunctionComponent,
};
