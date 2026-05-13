import React from 'react';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import {
  registerCompassPlugin,
  type AppRegistry,
} from '@mongodb-js/compass-app-registry';
import SidebarPlugin from './plugin';
import { createSidebarStore } from './stores';
import {
  type MongoDBInstancesManager,
  mongoDBInstancesManagerLocator,
} from '@mongodb-js/compass-app-stores/provider';

import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { AtlasClusterConnectionsOnly } from './components/multiple-connections/connections-navigation';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { I18nProvider, initLanguage } from './i18n';
import type { SidebarPluginProps } from './plugin';

function SidebarPluginWithI18n(props: SidebarPluginProps): React.ReactElement {
  return React.createElement(
    I18nProvider,
    null,
    React.createElement(SidebarPlugin, props)
  );
}

export const CompassSidebarPlugin = registerCompassPlugin(
  {
    name: 'CompassSidebar',
    component: SidebarPluginWithI18n,
    activate(
      _initialProps,
      {
        globalAppRegistry,
        connections,
        instancesManager,
        logger,
        preferences,
      }: {
        globalAppRegistry: AppRegistry;
        connections: ConnectionsService;
        instancesManager: MongoDBInstancesManager;
        logger: Logger;
        preferences: PreferencesAccess;
      },
      helpers: ActivateHelpers
    ) {
      initLanguage(preferences.getPreferences().language);
      const { store, deactivate } = createSidebarStore(
        {
          globalAppRegistry,
          connections,
          instancesManager,
          logger,
        },
        helpers
      );
      return {
        store,
        deactivate,
      };
    },
  },
  {
    connections: connectionsLocator,
    instancesManager: mongoDBInstancesManagerLocator,
    logger: createLoggerLocator('COMPASS-SIDEBAR-UI'),
    preferences: preferencesLocator,
  }
);

export const AtlasClusterConnectionsOnlyProvider =
  AtlasClusterConnectionsOnly.Provider;
