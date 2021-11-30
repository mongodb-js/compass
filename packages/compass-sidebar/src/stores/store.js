import { createStore, applyMiddleware } from 'redux';
import throttle from 'lodash/throttle';
import reducer from '../modules';
import thunk from 'redux-thunk';
import { globalAppRegistryActivated } from '@mongodb-js/mongodb-redux-common/app-registry';

import { changeInstance } from '../modules/instance';
import { changeActiveNamespace, changeDatabases } from '../modules/databases';
import { reset } from '../modules/reset';
import { toggleIsWritable } from '../modules/is-writable';
import { changeDescription } from '../modules/description';
import { toggleIsDataLake } from '../modules/is-data-lake';
import { loadDetailsPlugins } from '../modules/details-plugins';
import { toggleIsGenuineMongoDB } from '../modules/is-genuine-mongodb';
import { toggleIsGenuineMongoDBVisible } from '../modules/is-genuine-mongodb-visible';
import { changeConnection } from '../modules/connection-model';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  const onInstanceChange = throttle((newInstance) => {
    store.dispatch(changeInstance(newInstance.toJSON()));
  }, 100);

  const onDatabasesChange = throttle((databases) => {
    store.dispatch(changeDatabases(databases.toJSON()));
  }, 100);

  store.dispatch(globalAppRegistryActivated(appRegistry));

  store.dispatch(loadDetailsPlugins(appRegistry));

  appRegistry.on('data-service-connected', (_, dataService, connectionInfo, legacyConnectionModel) => {
    store.dispatch(changeConnection(legacyConnectionModel));
  });

  appRegistry.on('instance-destroyed', () => {
    onInstanceChange.cancel();
    onDatabasesChange.cancel();
  });

  appRegistry.on('instance-created', ({ instance }) => {
    onInstanceChange(instance);
    onDatabasesChange(instance.databases);

    if (process.env.COMPASS_NO_GLOBAL_OVERLAY !== 'true') {
      instance.on('change:isRefreshing', () => {
        onInstanceChange(instance);
        onDatabasesChange(instance.databases);
      });
    } else {
      instance.on('change:isRefreshing', () => {
        onInstanceChange(instance);
      });

      instance.on('change:status', () => {
        onInstanceChange(instance);
      });

      instance.on('change:databases.collectionsLength', () => {
        onInstanceChange(instance);
      });

      instance.on('change:databasesStatus', () => {
        onInstanceChange(instance);
        onDatabasesChange(instance.databases);
      });

      instance.on('change:databases.collectionsStatus', () => {
        onDatabasesChange(instance.databases);
      });
    }

    function onIsGenuineChange(isGenuine) {
      store.dispatch(toggleIsGenuineMongoDB(!!isGenuine));
      store.dispatch(toggleIsGenuineMongoDBVisible(!isGenuine));
    }

    instance.genuineMongoDB.on('change:isGenuine', (model, isGenuine) => {
      onIsGenuineChange(isGenuine);
    });

    function onIsDataLakeChange(isDataLake) {
      store.dispatch(toggleIsDataLake(isDataLake));
    }

    instance.dataLake.on('change:isDataLake', (model, isDataLake) => {
      onIsDataLakeChange(isDataLake);
    });
  });

  appRegistry.getStore('DeploymentAwareness.WriteStateStore').listen((state) => {
    store.dispatch(toggleIsWritable(state.isWritable));
    store.dispatch(changeDescription(state.description));
  });

  appRegistry.on('select-namespace', ({ namespace }) => {
    store.dispatch(changeActiveNamespace(namespace));
  });

  appRegistry.on('open-namespace-in-new-tab', ({ namespace }) => {
    store.dispatch(changeActiveNamespace(namespace));
  });

  appRegistry.on('select-database', (dbName) => {
    store.dispatch(changeActiveNamespace(dbName));
  });

  appRegistry.on('select-instance', () => {
    store.dispatch(changeActiveNamespace(''));
  });

  appRegistry.on('data-service-disconnected', () => {
    store.dispatch(reset());
  });
};

export default store;
