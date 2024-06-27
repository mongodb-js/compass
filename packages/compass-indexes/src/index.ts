import CreateIndexModal from './components/create-index-modal';
import { activatePlugin as activateCreateIndexPlugin } from './stores/create-index';
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
import {
  connectionInfoAccessLocator,
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import type { Logger } from '@mongodb-js/compass-logging';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import {
  createTelemetryLocator,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';

export const CompassIndexesHadronPlugin = registerHadronPlugin<
  CollectionTabPluginMetadata,
  {
    dataService: () => IndexesDataService;
    instance: () => MongoDBInstance;
    logger: () => Logger;
    track: () => TrackFunction;
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
    logger: createLoggerLocator('COMPASS-INDEXES-UI'),
    track: createTelemetryLocator(),
  }
);

export const CompassIndexesPlugin = {
  name: 'Indexes' as const,
  component: CompassIndexesHadronPlugin,
};

export const CreateIndexPlugin = registerHadronPlugin(
  {
    name: 'CreateIndex',
    activate: activateCreateIndexPlugin,
    component: CreateIndexModal,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<'createIndex'>,
    logger: createLoggerLocator('COMPASS-INDEXES-UI'),
    track: createTelemetryLocator(),
    connectionInfoAccess: connectionInfoAccessLocator,
  }
);

export const DropIndexPlugin = registerHadronPlugin(
  {
    name: 'DropIndex',
    activate: activateDropIndexPlugin,
    component: DropIndexComponent,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<'dropIndex'>,
    logger: createLoggerLocator('COMPASS-INDEXES-UI'),
    track: createTelemetryLocator(),
  }
);
