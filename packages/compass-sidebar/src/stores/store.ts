import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import throttle from 'lodash/throttle';
import thunk from 'redux-thunk';
import { globalAppRegistryActivated } from '@mongodb-js/mongodb-redux-common/app-registry';
import type { RootAction, RootState } from '../modules';
import reducer from '../modules';
import { changeInstance } from '../modules/instance';
import type { Location } from '../modules/location';
import { changeLocation } from '../modules/location';
import type { Database } from '../modules/databases';
import { changeActiveNamespace, changeDatabases } from '../modules/databases';
import { reset } from '../modules/reset';
import { toggleIsGenuineMongoDBVisible } from '../modules/is-genuine-mongodb-visible';
import { changeConnectionInfo } from '../modules/connection-info';
import { changeConnectionOptions } from '../modules/connection-options';
import { setDataService } from '../modules/data-service';
import { toggleSidebar } from '../modules/is-expanded';
import type { AppRegistry } from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { DataService } from 'mongodb-data-service';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import type toNS from 'mongodb-ns';
type NS = ReturnType<typeof toNS>;

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

  const onInstanceChange = throttle((instance) => {
    onInstanceChangeNow(instance);
  }, 300);

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

  const onDatabasesChange = throttle((databases: Database[]) => {
    const dbs = databases.map((db) => {
      return {
        ...getDatabaseInfo(db),
        collections: db.collections.map((coll) => {
          return getCollectionInfo(coll);
        }),
      };
    });

    store.dispatch(changeDatabases(dbs));
  }, 300);

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

  onInstanceEvent('change:refreshingStatus', () => {
    // This will always fire when we start fetching the instance details which
    // will cause a 300ms throttle before any instance details can update if
    // we send it though the throttled update. That's long enough for the
    // sidebar to display that we're connected to a standalone instance when
    // we're really connected to dataLake.
    onInstanceChangeNow(instance);
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

  on(instance.build as any, 'change:isEnterprise', () => {
    onInstanceChange(instance);
  });

  on(instance.build as any, 'change:version', () => {
    onInstanceChange(instance);
  });

  on(instance.dataLake as any, 'change:isDataLake', () => {
    onInstanceChange(instance);
  });

  on(instance.dataLake as any, 'change:version', () => {
    onInstanceChange(instance);
  });

  store.dispatch(
    toggleIsGenuineMongoDBVisible(!instance.genuineMongoDB.isGenuine)
  );

  on(
    instance.genuineMongoDB as any,
    'change:isGenuine',
    (model: unknown, isGenuine: boolean) => {
      onInstanceChange(instance); // isGenuineMongoDB is part of instance state
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

  onAppRegistryEvent(
    'select-namespace',
    ({ namespace }: { namespace: string | NS }) => {
      store.dispatch(changeActiveNamespace(namespace));
      store.dispatch(changeLocation('collection'));
    }
  );

  onAppRegistryEvent(
    'open-namespace-in-new-tab',
    ({ namespace }: { namespace: string | NS }) => {
      store.dispatch(changeActiveNamespace(namespace));
      store.dispatch(changeLocation('collection'));
    }
  );

  onAppRegistryEvent('select-database', (dbName: string) => {
    store.dispatch(changeActiveNamespace(dbName));
    store.dispatch(changeLocation('database'));
  });

  onAppRegistryEvent(
    'open-instance-workspace',
    (tabName: Location | null = null) => {
      store.dispatch(changeActiveNamespace(''));
      store.dispatch(changeLocation(tabName));
    }
  );

  onAppRegistryEvent('data-service-disconnected', () => {
    store.dispatch(reset());
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
