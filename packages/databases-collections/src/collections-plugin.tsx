import React from 'react';
import {
  databaseModelLocator,
  mongoDBInstanceLocator,
} from '@mongodb-js/compass-app-stores/provider';
import { activatePlugin as activateCollectionsTabPlugin } from './stores/collections-store';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import {
  dataServiceLocator,
  type DataServiceLocator,
  type DataService,
} from '@mongodb-js/compass-connections/provider';

export const CollectionsWorkspaceName = 'Collections' as const;

export const CollectionsPlugin = registerCompassPlugin(
  {
    name: 'Collections' as const,
    component: function CollectionsProvider({ children }) {
      return React.createElement(React.Fragment, null, children);
    },
    activate: activateCollectionsTabPlugin,
  },
  {
    instance: mongoDBInstanceLocator,
    database: databaseModelLocator,
    dataService: dataServiceLocator as DataServiceLocator<keyof DataService>,
  }
);
