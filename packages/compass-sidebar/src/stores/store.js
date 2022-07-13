import { createStore, applyMiddleware } from 'redux';
import throttle from 'lodash/throttle';
import thunk from 'redux-thunk';
import { globalAppRegistryActivated } from '@mongodb-js/mongodb-redux-common/app-registry';
import reducer from '../modules';
import { changeInstance } from '../modules/instance';
import { changeActiveNamespace, changeDatabases } from '../modules/databases';
import { reset } from '../modules/reset';
import { toggleIsGenuineMongoDBVisible } from '../modules/is-genuine-mongodb-visible';
import { changeConnectionInfo } from '../modules/connection-info';
import { changeConnectionOptions } from '../modules/connection-options';

const store = createStore(reducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {

  const onInstanceChangeNow = (instance) => {
    store.dispatch(
      changeInstance({
        refreshingStatus: instance.refreshingStatus,
        databasesStatus: instance.databasesStatus,
        csfleMode: instance.csfleMode,
        build: instance.build,
        dataLake: instance.dataLake,
        genuineMongoDB: instance.genuineMongoDB,
        topologyDescription: instance.topologyDescription,
        isWritable: instance.isWritable,
        env: instance.env
      })
    );
  };

  const onInstanceChange = throttle((instance) => {
    onInstanceChangeNow(instance);
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

  appRegistry.on('data-service-connected', (_, dataService, connectionInfo) => {
    store.dispatch(changeConnectionInfo(connectionInfo));
    const connectionOptions = dataService.getConnectionOptions();
    store.dispatch(changeConnectionOptions(connectionOptions)); // stores ssh tunnel status

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
    onInstanceChangeNow(instance);
    onDatabasesChange(instance.databases);

    instance.on('change:csfleMode', () => {
      onInstanceChange(instance);
    });

    instance.on('change:refreshingStatus', () => {
      // This will always fire when we start fetching the instance details which
      // will cause a 300ms throttle before any instance details can update if
      // we send it though the throttled update. That's long enough for the
      // sidebar to display that we're connected to a standalone instance when
      // we're really connected to dataLake.
      onInstanceChangeNow(instance);
    });

    instance.on('change:databasesStatus', () => {
      onInstanceChange(instance);
      onDatabasesChange(instance.databases);
    });

    instance.on('change:databases.', () => {
      onDatabasesChange(instance.databases);
    });

    instance.on('change:databases.collectionsStatus', () => {
      onDatabasesChange(instance.databases);
    });

    instance.build.on('change:isEnterprise', () => {
      onInstanceChange(instance);
    });

    instance.build.on('change:version', () => {
      onInstanceChange(instance);
    });

    instance.dataLake.on('change:isDataLake', () => {
      onInstanceChange(instance);
    });

    instance.dataLake.on('change:version', () => {
      onInstanceChange(instance);
    });

    store.dispatch(toggleIsGenuineMongoDBVisible(!instance.genuineMongoDB.isGenuine));

    instance.genuineMongoDB.on('change:isGenuine', (model, isGenuine) => {
      onInstanceChange(instance); // isGenuineMongoDB is part of instance state
      store.dispatch(toggleIsGenuineMongoDBVisible(!isGenuine));
    });

    instance.on('change:topologyDescription', () => {
      onInstanceChange(instance);
    });

    instance.on('change:isWritable', () => {
      onInstanceChange(instance);
    });

    instance.on('change:env', () => {
      onInstanceChange(instance);
    });
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
