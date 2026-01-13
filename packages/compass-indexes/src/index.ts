import React from 'react';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
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
  provider: CompassIndexesPluginProvider,
  content: Indexes as React.FunctionComponent,
  header: IndexesTabTitle as React.FunctionComponent,
};

// Export drawer components
export { CompassIndexesDrawerProvider } from './components/drawer/compass-indexes-provider';
export { CompassIndexesDrawer } from './components/drawer/compass-indexes-drawer';
export {
  useIndexesDrawerActions,
  useIndexesDrawerContext,
  compassIndexesDrawerServiceLocator,
  INDEXES_DRAWER_ID,
} from './components/drawer/compass-indexes-provider';
export type {
  CompassIndexesDrawerService,
  IndexesDrawerContextType,
} from './components/drawer/compass-indexes-provider';
