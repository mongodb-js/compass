import React from 'react';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { activatePlugin as activateDatabasesTabPlugin } from './stores/databases-store';
import { registerCompassPlugin } from 'compass-app-registry';
import {
  dataServiceLocator,
  type DataServiceLocator,
  type DataService,
} from '@mongodb-js/compass-connections/provider';

export const DatabasesWorkspaceName = 'Databases' as const;

export const DatabasesPlugin = registerCompassPlugin(
  {
    name: 'Databases' as const,
    component: function DatabasesProvider({ children }) {
      return React.createElement(React.Fragment, null, children);
    },
    activate: activateDatabasesTabPlugin,
  },
  {
    instance: mongoDBInstanceLocator,
    dataService: dataServiceLocator as DataServiceLocator<keyof DataService>,
  }
);
