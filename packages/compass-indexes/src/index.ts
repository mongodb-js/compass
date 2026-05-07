import React from 'react';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import {
  activateIndexesPlugin,
  type IndexesDataServiceProps,
} from './stores/store';
import Indexes from './components/indexes/indexes';
import {
  connectionInfoRefLocator,
  type DataServiceLocator,
  dataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import {
  collectionModelLocator,
  mongoDBInstanceLocator,
} from '@mongodb-js/compass-app-stores/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import {
  telemetryLocator,
  experimentationServiceLocator,
} from '@mongodb-js/compass-telemetry/provider';
import { IndexesTabTitle } from './plugin-title';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { IndexesDrawer } from './plugin-drawer';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';

export const CompassIndexesPluginProvider = registerCompassPlugin(
  {
    name: 'CompassIndexes',
    component: function IndexesProvider({ children }) {
      return React.createElement(React.Fragment, null, children);
    },
    activate: activateIndexesPlugin,
  },
  {
    dataService:
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      dataServiceLocator as DataServiceLocator<IndexesDataServiceProps>,
    connectionInfoRef: connectionInfoRefLocator,
    instance: mongoDBInstanceLocator,
    logger: createLoggerLocator('COMPASS-INDEXES-UI'),
    track: telemetryLocator,
    collection: collectionModelLocator,
    atlasService: atlasServiceLocator,
    preferences: preferencesLocator,
    workspaces: workspacesServiceLocator,
    experimentationServices: experimentationServiceLocator,
  }
);

export const CompassIndexesPlugin = {
  name: 'Indexes' as const,
  provider: CompassIndexesPluginProvider,
  content: Indexes as React.FunctionComponent,
  header: IndexesTabTitle as React.FunctionComponent,
  drawer: IndexesDrawer as React.FunctionComponent,
};
