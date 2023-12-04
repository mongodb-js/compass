import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import throttle from 'lodash/throttle';
import thunk from 'redux-thunk';
import { globalAppRegistryActivated } from '@mongodb-js/mongodb-redux-common/app-registry';
import type { RootAction, RootState } from '../modules';
import reducer from '../modules';
import { changeInstance } from '../modules/instance';
import type { Database } from '../modules/databases';
import { changeDatabases } from '../modules/databases';
import { toggleIsGenuineMongoDBVisible } from '../modules/is-genuine-mongodb-visible';
import { changeConnectionInfo } from '../modules/connection-info';
import { changeConnectionOptions } from '../modules/connection-options';
import { setDataService } from '../modules/data-service';
import { toggleSidebar } from '../modules/is-expanded';
import type { AppRegistry } from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { DataService } from 'mongodb-data-service';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';

export function createSidebarStore({
  globalAppRegistry,
  instance,
  dataService,
  connectionInfo,
}: {
  globalAppRegistry: AppRegistry;
  instance: MongoDBInstance;
  dataService: DataService;
  connectionInfo: ConnectionInfo | null | undefined;
}): {
  store: Store<RootState, RootAction>;
  deactivate: () => void;
} {
  const cleanup: (() => void)[] = [];
  const store: Store<RootState, RootAction> = createStore(
    reducer,
    applyMiddleware(thunk)
  );

  const onInstanceChangeNow = (instance: any /* MongoDBInstance */) => {
    store.dispatch(
      changeInstance({
        status: instance.status,
        refreshingStatus: instance.refreshingStatus,
        databasesStatus: instance.databasesStatus,
        csfleMode: instance.csfleMode,
        build: instance.build.toJSON(),
        dataLake: instance.dataLake.toJSON(),
        genuineMongoDB: instance.genuineMongoDB.toJSON(),
        topologyDescription: instance.topologyDescription.toJSON(),
        isWritable: instance.isWritable,
        env: instance.env,
        isAtlas: instance.isAtlas,
        isLocalAtlas: instance.isLocalAtlas,
      })
    );
  };

  const onInstanceChange = throttle(
    (instance) => {
      onInstanceChangeNow(instance);
    },
    300,
    { leading: true, trailing: true }
  );

  cleanup.push(() => {
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
    };
  }

  const onDatabasesChange = throttle(
    (databases: Database[]) => {
      const dbs = databases.map((db) => {
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

  cleanup.push(() => {
    onDatabasesChange.cancel();
  });

  store.dispatch(globalAppRegistryActivated(globalAppRegistry));

  function on(
    eventEmitter: {
      on(ev: string, l: (...args: any[]) => void): void;
      removeListener(ev: string, l: (...args: any[]) => void): void;
    },
    ev: string,
    listener: (...args: any[]) => void
  ) {
    eventEmitter.on(ev, listener);
    cleanup.push(() => eventEmitter.removeListener(ev, listener));
  }
  const onAppRegistryEvent = (ev: string, listener: (...args: any[]) => void) =>
    on(globalAppRegistry, ev, listener);
  const onInstanceEvent = (ev: string, listener: (...args: any[]) => void) =>
    on(instance, ev, listener);

  store.dispatch(setDataService(dataService));
  if (connectionInfo) store.dispatch(changeConnectionInfo(connectionInfo));
  const connectionOptions = dataService.getConnectionOptions();
  store.dispatch(changeConnectionOptions(connectionOptions)); // stores ssh tunnel status

  onInstanceChangeNow(instance);
  onDatabasesChange(instance.databases);

  onInstanceEvent('change:csfleMode', () => {
    onInstanceChange(instance);
  });

  onInstanceEvent('change:status', () => {
    onInstanceChange(instance);
  });

  onInstanceEvent('change:refreshingStatus', () => {
    onInstanceChange(instance);
  });

  onInstanceEvent('change:databasesStatus', () => {
    onInstanceChange(instance);
    onDatabasesChange(instance.databases);
  });

  onInstanceEvent('change:databases', () => {
    onDatabasesChange(instance.databases);
  });

  onInstanceEvent('change:databases.collectionsStatus', () => {
    onDatabasesChange(instance.databases);
  });

  store.dispatch(
    toggleIsGenuineMongoDBVisible(!instance.genuineMongoDB.isGenuine)
  );

  onInstanceEvent(
    'change:genuineMongoDB.isGenuine',
    (_model: unknown, isGenuine: boolean) => {
      store.dispatch(toggleIsGenuineMongoDBVisible(!isGenuine));
    }
  );

  onInstanceEvent('change:topologyDescription', () => {
    onInstanceChange(instance);
  });

  onInstanceEvent('change:isWritable', () => {
    onInstanceChange(instance);
  });

  onInstanceEvent('change:env', () => {
    onInstanceChange(instance);
  });

  onAppRegistryEvent('toggle-sidebar', () => {
    store.dispatch(toggleSidebar());
  });

  return {
    store,
    deactivate() {
      for (const cleaner of cleanup) cleaner();
    },
  };
}
