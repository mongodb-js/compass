import type AppRegistry from 'hadron-app-registry';
import CreateIndexPlugin from './create-index-plugin';
import configureCreateIndexStore from './stores/create-index';
import {
  activatePlugin as activateDropIndexPlugin,
  DropIndexComponent,
} from './stores/drop-index';
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

export const DropIndexPlugin = registerHadronPlugin(
  {
    name: 'DropIndex',
    activate: activateDropIndexPlugin,
    component: DropIndexComponent,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<'dropIndex'>,
    logger: createLoggerAndTelemetryLocator('COMPASS-INDEXES-UI'),
  }
);

/**
 * Activate all the components in the Indexes package.
 * @param {Object} appRegistry - The Hadron appRegistry to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Collection.ScopedModal', CREATE_INDEX_ROLE);
}

/**
 * Deactivate all the components in the Indexes package.
 * @param {Object} appRegistry - The Hadron appRegistry to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Collection.ScopedModal', CREATE_INDEX_ROLE);
}

export { activate, deactivate };
export { default as metadata } from '../package.json';
