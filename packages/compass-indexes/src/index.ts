import type AppRegistry from 'hadron-app-registry';

import CreateIndexPlugin from './create-index-plugin';
import DropIndexPlugin from './drop-index-plugin';
import configureCreateIndexStore from './stores/create-index';
import configureDropIndexStore from './stores/drop-index';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { IndexesDataService } from './stores/store';
import {
  activateIndexesPlugin,
  type IndexesDataServiceProps,
} from './stores/store';
import Indexes from './components/indexes/indexes';
import type { DataServiceLocator } from 'mongodb-data-service/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';

export const CompassIndexesHadronPlugin = registerHadronPlugin<
  CollectionTabPluginMetadata,
  {
    dataService: () => IndexesDataService;
    instance: () => MongoDBInstance;
    logger: () => LoggerAndTelemetry;
  }
>(
  {
    name: 'CompassIndexes',
    component: Indexes as React.FunctionComponent,
    activate: activateIndexesPlugin,
  },
  {
    dataService:
      dataServiceLocator as DataServiceLocator<IndexesDataServiceProps>,
    instance: mongoDBInstanceLocator,
    logger: createLoggerAndTelemetryLocator('COMPASS-INDEXES-UI'),
  }
);

export const CompassIndexesPlugin = {
  name: 'Indexes',
  component: CompassIndexesHadronPlugin,
};

const CREATE_INDEX_ROLE = {
  name: 'Create Index',
  component: CreateIndexPlugin,
  configureStore: configureCreateIndexStore,
  configureActions: () => {
    /* noop */
  },
  storeName: 'Indexes.CreateIndexStore',
  actionName: 'Indexes.CreateIndexActions',
};

const DROP_INDEX_ROLE = {
  name: 'Drop Index',
  component: DropIndexPlugin,
  configureStore: configureDropIndexStore,
  configureActions: () => {
    /* noop */
  },
  storeName: 'Indexes.DropIndexStore',
  actionName: 'Indexes.DropIndexActions',
};

/**
 * Activate all the components in the Indexes package.
 * @param {Object} appRegistry - The Hadron appRegistry to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Collection.ScopedModal', CREATE_INDEX_ROLE);
  appRegistry.registerRole('Collection.ScopedModal', DROP_INDEX_ROLE);
}

/**
 * Deactivate all the components in the Indexes package.
 * @param {Object} appRegistry - The Hadron appRegistry to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Collection.ScopedModal', CREATE_INDEX_ROLE);
  appRegistry.deregisterRole('Collection.ScopedModal', DROP_INDEX_ROLE);
}

export { activate, deactivate };
export { default as metadata } from '../package.json';
