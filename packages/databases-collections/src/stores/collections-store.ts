import throttle from 'lodash/throttle';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { collectionsReducer } from '../modules';
import type AppRegistry from 'hadron-app-registry';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { DataService } from 'mongodb-data-service';
import type { ActivateHelpers } from 'hadron-app-registry';
import { collectionsChanged, instanceChanged } from '../modules/collections';
import type Database from 'mongodb-database-model';

export type CollectionsServices = {
  globalAppRegistry: AppRegistry;
  instance: MongoDBInstance;
  dataService: DataService;
};

export type CollectionsThunkExtraArg = {
  globalAppRegistry: AppRegistry;
  database: Database;
  dataService: DataService;
};

export function activatePlugin(
  { namespace }: { namespace: string },
  { globalAppRegistry, instance, dataService }: CollectionsServices,
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const database = instance.databases.get(namespace);

  if (!database) {
    throw new Error("Can't activate collections workspace without database");
  }

  const store = createStore(
    collectionsReducer,
    {
      collections: database.collections.toJSON(),
      collectionsLoadingStatus: {
        status: database.collectionsStatus,
        error: database.collectionsStatusError,
      },
      instance: {
        isWritable: instance.isWritable,
        isDataLake: instance.dataLake.isDataLake,
      },
    },
    applyMiddleware(
      thunk.withExtraArgument({ globalAppRegistry, database, dataService })
    )
  );

  const onCollectionsChanged = throttle(
    () => {
      store.dispatch(collectionsChanged(database));
    },
    300,
    { leading: true, trailing: true }
  );

  addCleanup(() => {
    onCollectionsChanged.cancel();
  });

  on(database, 'change:collectionsStatus', onCollectionsChanged);
  on(database, 'change:collections.status', onCollectionsChanged);
  on(database, 'add:collections', onCollectionsChanged);
  on(database, 'remove:collections', onCollectionsChanged);

  on(instance, 'change:dataLake.isDataLake', () => {
    store.dispatch(instanceChanged(instance));
  });

  on(instance, 'change:isWritable', () => {
    store.dispatch(instanceChanged(instance));
  });

  void database.fetchCollectionsDetails({ dataService });

  return {
    store,
    deactivate: cleanup,
  };
}
