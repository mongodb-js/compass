import { createStore, applyMiddleware } from 'redux';
import throttle from 'lodash/throttle';
import thunk from 'redux-thunk';
import reducer from '../modules';
import { changeInstance } from '../modules/instance';
import type { Database } from '../modules/databases';
import { changeDatabases } from '../modules/databases';
import { toggleIsGenuineMongoDBVisible } from '../modules/is-genuine-mongodb-visible';
import { changeConnectionInfo } from '../modules/connection-info';
import { changeConnectionOptions } from '../modules/connection-options';
import { setDataService } from '../modules/data-service';
import { toggleSidebar } from '../modules/is-expanded';
import type { ActivateHelpers, AppRegistry } from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { DataService } from 'mongodb-data-service';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { setIsPerformanceTabSupported } from '../modules/is-performance-tab-supported';
import type { MongoServerError } from 'mongodb';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

export function createSidebarStore(
  {
    globalAppRegistry,
    instance,
    dataService,
    connectionInfo,
    logger: { log, mongoLogId },
  }: {
    globalAppRegistry: AppRegistry;
    instance: MongoDBInstance;
    dataService: DataService;
    connectionInfo: ConnectionInfo | null | undefined;
    logger: LoggerAndTelemetry;
  },
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const store = createStore(
    reducer,
    applyMiddleware(thunk.withExtraArgument({ globalAppRegistry }))
  );

  const onInstanceChange = throttle(
    () => {
      store.dispatch(
        changeInstance({
          status: instance.status,
          refreshingStatus: instance.refreshingStatus,
          databasesStatus: instance.databasesStatus,
          csfleMode: instance.csfleMode,
          build: {
            isEnterprise: instance.build.isEnterprise,
            version: instance.build.version,
          },
          dataLake: {
            isDataLake: instance.dataLake.isDataLake,
            version: instance.dataLake.version,
          },
          genuineMongoDB: {
            dbType: instance.genuineMongoDB.dbType,
            isGenuine: instance.genuineMongoDB.isGenuine,
          },
          topologyDescription: {
            servers: instance.topologyDescription.servers,
            setName: instance.topologyDescription.setName,
            type: instance.topologyDescription.type,
          },
          isWritable: instance.isWritable,
          env: instance.env,
          isAtlas: instance.isAtlas,
          isLocalAtlas: instance.isLocalAtlas,
        })
      );
    },
    300,
    { leading: true, trailing: true }
  );

  addCleanup(() => {
    onInstanceChange.cancel();
  });

  function getDatabaseInfo(db: Database) {
    return {
      _id: db._id,
      name: db.name,
      collectionsStatus: db.collectionsStatus,
      collectionsLength: db.collectionsLength,
    };
  }

  function getCollectionInfo(coll: Database['collections'][number]) {
    return {
      _id: coll._id,
      name: coll.name,
      type: coll.type,
      sourceName: coll.sourceName,
      pipeline: coll.pipeline,
    };
  }

  const onDatabasesChange = throttle(
    () => {
      const dbs = instance.databases.map((db) => {
        return {
          ...getDatabaseInfo(db),
          collections: db.collections.map((coll) => {
            return getCollectionInfo(coll);
          }),
        };
      });

      store.dispatch(changeDatabases(dbs));
    },
    300,
    { leading: true, trailing: true }
  );

  addCleanup(() => {
    onDatabasesChange.cancel();
  });

  store.dispatch(setDataService(dataService));
  if (connectionInfo) store.dispatch(changeConnectionInfo(connectionInfo));
  const connectionOptions = dataService.getConnectionOptions();
  store.dispatch(changeConnectionOptions(connectionOptions)); // stores ssh tunnel status

  onInstanceChange();
  onDatabasesChange();

  on(instance, 'change:status', onInstanceChange);
  on(instance, 'change:refreshingStatus', onInstanceChange);
  on(instance, 'change:databasesStatus', onInstanceChange);
  on(instance, 'change:csfleMode', onInstanceChange);
  on(instance, 'change:topologyDescription', onInstanceChange);
  on(instance, 'change:isWritable', onInstanceChange);
  on(instance, 'change:env', onInstanceChange);

  on(instance, 'change:databasesStatus', onDatabasesChange);
  on(instance, 'add:databases', onDatabasesChange);
  on(instance, 'remove:databases', onDatabasesChange);
  on(instance, 'change:databases', onDatabasesChange);
  on(instance, 'change:databases.collectionsStatus', onDatabasesChange);

  on(instance, 'add:collections', onDatabasesChange);
  on(instance, 'remove:collections', onDatabasesChange);
  on(instance, 'change:collections._id', onDatabasesChange);
  on(instance, 'change:collections.status', onDatabasesChange);

  store.dispatch(
    toggleIsGenuineMongoDBVisible(!instance.genuineMongoDB.isGenuine)
  );

  on(
    instance,
    'change:genuineMongoDB.isGenuine',
    (_model: unknown, isGenuine: boolean) => {
      store.dispatch(toggleIsGenuineMongoDBVisible(!isGenuine));
    }
  );

  on(globalAppRegistry, 'toggle-sidebar', () => {
    store.dispatch(toggleSidebar());
  });

  // Checking if "Performance" tab is supported by running commands required for
  // the "Performance" tab to function
  void Promise.all([dataService.currentOp(), dataService.top()]).then(
    () => {
      store.dispatch(setIsPerformanceTabSupported(true));
    },
    (err) => {
      log.info(
        mongoLogId(1_001_000_278),
        'Sidebar',
        'Performance tab requied commands failed',
        { error: (err as Error).message }
      );
      // Only disable performance tab if encountered Atlas error
      const isSupported =
        (err as MongoServerError).codeName === 'AtlasError' ? false : true;
      store.dispatch(setIsPerformanceTabSupported(isSupported));
    }
  );

  return {
    store,
    deactivate: cleanup,
  };
}
