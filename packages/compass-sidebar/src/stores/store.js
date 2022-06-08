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
import { changeConnectionInfo } from '../modules/connection-info';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  const onInstanceChange = throttle((instance) => {
    store.dispatch(
      changeInstance({
        refreshingStatus: instance.refreshingStatus,
        databasesStatus: instance.databasesStatus,
        csfleMode: instance.csfleMode,
      })
    );
  }, 300);

  function getDatabaseInfo(db) {
    return {
      _id: db._id,
      name: db.name,
      collectionsStatus: db.collectionsStatus,
      collectionsLength: db.collectionsLength,
    };
  }

  function getCollectionInfo(coll) {
    return {
      _id: coll._id,
      name: coll.name,
      type: coll.type,
    };
  }

  const onDatabasesChange = throttle((databases) => {
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

  store.dispatch(globalAppRegistryActivated(appRegistry));

  store.dispatch(loadDetailsPlugins(appRegistry));

  appRegistry.on('data-service-connected', (_, dataService, connectionInfo) => {
    store.dispatch(changeConnectionInfo(connectionInfo));

    appRegistry.removeAllListeners('sidebar-toggle-csfle-enabled');
    appRegistry.on('sidebar-toggle-csfle-enabled', (enabled) => {
      dataService.setCSFLEEnabled(enabled);
      appRegistry.emit('refresh-data');
    });
  });

  appRegistry.on('instance-destroyed', () => {
    onInstanceChange.cancel();
    onDatabasesChange.cancel();
  });

  appRegistry.on('instance-created', ({ instance }) => {
    onInstanceChange(instance);
    onDatabasesChange(instance.databases);

    instance.on('change:csfleMode', () => {
      onInstanceChange(instance);
    });

    instance.on('change:refreshingStatus', () => {
      onInstanceChange(instance);
    });

    instance.on('change:databasesStatus', () => {
      onInstanceChange(instance);
      onDatabasesChange(instance.databases);
    });

    instance.on('change:databases.status', () => {
      onDatabasesChange(instance.databases);
    });

    instance.on('change:databases.collectionsStatus', () => {
      onDatabasesChange(instance.databases);
    });

    function onIsGenuineChange(isGenuine) {
      store.dispatch(toggleIsGenuineMongoDB(!!isGenuine));
      store.dispatch(toggleIsGenuineMongoDBVisible(!isGenuine));
    }

    onIsGenuineChange(instance.genuineMongoDB.isGenuine);

    instance.genuineMongoDB.on('change:isGenuine', (model, isGenuine) => {
      onIsGenuineChange(isGenuine);
    });

    function onIsDataLakeChange(isDataLake) {
      store.dispatch(toggleIsDataLake(isDataLake));
    }

    onIsDataLakeChange(instance.dataLake.isDataLake);

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

  appRegistry.on('open-instance-workspace', () => {
    store.dispatch(changeActiveNamespace(''));
  });

  appRegistry.on('data-service-disconnected', () => {
    store.dispatch(reset());
  });
};

export default store;
