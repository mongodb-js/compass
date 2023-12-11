import throttle from 'lodash/throttle';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import databasesReducer, {
  databasesChanged,
  instanceChanged,
} from '../modules/databases';
import type AppRegistry from 'hadron-app-registry';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import type { DataService } from 'mongodb-data-service';
import type { ActivateHelpers } from 'hadron-app-registry';

type DatabasesTabServices = {
  globalAppRegistry: AppRegistry;
  instance: MongoDBInstance;
  dataService: DataService;
};

export function activatePlugin(
  _initialProps: Record<string, never>,
  { globalAppRegistry, instance, dataService }: DatabasesTabServices,
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const store = createStore(
    databasesReducer,
    {
      databases: instance.databases.toJSON(),
      databasesLoadingStatus: {
        status: instance.databasesStatus,
        error: instance.databasesStatusError,
      },
      instance: {
        isWritable: instance.isWritable,
        isDataLake: instance.dataLake.isDataLake,
        isGenuineMongoDB: instance.genuineMongoDB.isGenuine,
      },
    },
    applyMiddleware(thunk.withExtraArgument({ globalAppRegistry }))
  );

  const onDatabasesChanged = throttle(
    () => {
      store.dispatch(databasesChanged(instance));
    },
    300,
    { leading: true, trailing: true }
  );

  addCleanup(() => {
    onDatabasesChanged.cancel();
  });

  on(instance, 'change:databasesStatus', onDatabasesChanged);
  on(instance, 'change:databases.status', onDatabasesChanged);
  on(instance, 'add:databases', onDatabasesChanged);
  on(instance, 'remove:databases', onDatabasesChanged);

  const onInstanceChanged = () => {
    store.dispatch(instanceChanged(instance));
  };

  on(instance, 'change:isWritable', onInstanceChanged);
  on(instance, 'change:dataLake.isDataLake', onInstanceChanged);
  on(instance, 'change:genuineMongoDB.isGenuine', onInstanceChanged);

  void instance.fetchDatabases({ dataService });

  return {
    store,
    deactivate: cleanup,
  };
}
