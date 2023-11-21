import throttle from 'lodash/throttle';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import databasesReducer, {
  databasesChanged,
  instanceChanged,
} from '../modules/databases';
import type AppRegistry from 'hadron-app-registry';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';

type DatabasesTabServices = {
  globalAppRegistry: AppRegistry;
  instance: MongoDBInstance;
};

export function activatePlugin(
  _: unknown,
  { globalAppRegistry, instance }: DatabasesTabServices
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

  const onDatabasesChanged = throttle(() => {
    store.dispatch(databasesChanged(instance));
  }, 300);

  instance.on('change:databasesStatus', onDatabasesChanged);
  instance.on('change:databases.status', onDatabasesChanged);

  const onInstanceChanged = () => {
    store.dispatch(instanceChanged(instance));
  };

  instance.on('change:isWritable', onInstanceChanged);
  instance.on('change:dataLake.isDataLake', onInstanceChanged);
  instance.on('change:genuineMongoDB.isGenuine', onInstanceChanged);

  return {
    store,
    deactivate() {
      onDatabasesChanged.cancel();

      instance.removeListener('change:databasesStatus', onDatabasesChanged);
      instance.removeListener('change:databases.status', onDatabasesChanged);

      instance.removeListener('change:isWritable', onInstanceChanged);
      instance.removeListener('change:dataLake.isDataLake', onInstanceChanged);
      instance.removeListener(
        'change:genuineMongoDB.isGenuine',
        onInstanceChanged
      );
    },
  };
}
