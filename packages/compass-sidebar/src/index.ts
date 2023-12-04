import { registerHadronPlugin, type AppRegistry } from 'hadron-app-registry';
import type { SidebarPluginProps } from './plugin';
import SidebarPlugin from './plugin';
import { createSidebarStore } from './stores';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import type { DataService } from 'mongodb-data-service';
import type { MongoDBInstance } from 'mongodb-instance-model';

function activate() {
  // noop
}

function deactivate() {
  // noop
}

export const CompassSidebarPlugin = registerHadronPlugin<
  SidebarPluginProps,
  {
    instance: () => MongoDBInstance;
    dataService: () => DataService;
  }
>(
  {
    name: 'CompassSidebar',
    component: SidebarPlugin,
    activate(
      { initialConnectionInfo }: SidebarPluginProps,
      {
        globalAppRegistry,
        instance,
        dataService,
      }: {
        globalAppRegistry: AppRegistry;
        instance: MongoDBInstance;
        dataService: DataService;
      }
    ) {
      const { store, deactivate } = createSidebarStore({
        globalAppRegistry,
        instance,
        dataService,
        connectionInfo: initialConnectionInfo,
      });
      return {
        store,
        deactivate,
      };
    },
  },
  {
    instance: mongoDBInstanceLocator,
    dataService: dataServiceLocator,
  }
);

export { activate, deactivate };
export { default as metadata } from '../package.json';
