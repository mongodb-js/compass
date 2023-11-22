/// <reference path="./typings.d.ts" />
import { registerHadronPlugin, type AppRegistry } from 'hadron-app-registry';
import SidebarPlugin from './plugin';
import { createSidebarStore } from './stores';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import { type ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import type { DataService } from 'mongodb-data-service';
import type { MongoDBInstance } from 'mongodb-instance-model';

function activate() {
  // noop
}

function deactivate() {
  // noop
}

interface SidebarPluginProps {
  connectionInfo: ConnectionInfo | null | undefined;
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
      { connectionInfo }: SidebarPluginProps,
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
        connectionInfo,
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
