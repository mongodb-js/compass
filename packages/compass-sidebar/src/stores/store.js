import { createStore, applyMiddleware } from 'redux';
import throttle from 'lodash/throttle';
import reducer from '../modules';
import thunk from 'redux-thunk';
import { globalAppRegistryActivated } from '@mongodb-js/mongodb-redux-common/app-registry';
import { Environment, serversArray } from 'mongodb-instance-model'
import { changeInstance } from '../modules/instance';
import { changeActiveNamespace, changeDatabases } from '../modules/databases';
import { reset } from '../modules/reset';
import { toggleIsWritable } from '../modules/is-writable';
import { changeDescription } from '../modules/description';
import { toggleIsDataLake } from '../modules/is-data-lake';
import { toggleIsGenuineMongoDB } from '../modules/is-genuine-mongodb';
import { toggleIsGenuineMongoDBVisible } from '../modules/is-genuine-mongodb-visible';
import { changeConnectionInfo } from '../modules/connection-info';
import { changeInstanceStatus  } from '../modules/server-version';
import { changeAtlasInstanceStatus, changeTopologyDescription } from '../modules/deployment-awareness';
import { changeDataService } from '../modules/ssh-tunnel-status';

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


  const onInstanceStatusChange = (instance, newStatus) => {
    if (newStatus !== 'ready') {
      return;
    }

    const state = store.getState();

    const prevVersion = state.versionNumber;
    if (instance.build.version !== prevVersion) {
      // TODO: this is probably not the ideal place for this event to be emitted from
      appRegistry.emit('server-version-changed', instance.build.version);
    }

    store.dispatch(changeInstanceStatus(instance, newStatus));

    const { isAtlas, dataLake } = instance;

    if (!isAtlas) {
      return;
    }

    const env = dataLake.isDataLake ? Environment.ADL : Environment.ATLAS;
    // TODO: again probably not the ideal place for this event to be emitted from
    appRegistry.emit('compass:deployment-awareness:topology-changed', {
      topologyType: state.deploymentAwareness.topologyType,
      setName: state.deploymentAwareness.setName,
      servers: state.deploymentAwareness.servers,
      env // TODO: move this separately
    });

    store.dispatch(changeAtlasInstanceStatus(instance, newStatus));
  };

  const onTopologyDescriptionChanged = (topologyDescription) => {
    const state = store.getState();
    if (topologyDescription.type !== state.topologyType) {
      const servers = serversArray(topologyDescription.servers);

      // TODO: again, this is probably not the ideal place for this event to be emitted from
      appRegistry.emit(
        'compass:deployment-awareness:topology-changed',
        {
          topologyType: topologyDescription.type,
          setName: topologyDescription.setName,
          env: state.deploymentAwareness.env, // TODO: move this
          servers
        }
      );
    }

    store.dispatch(changeTopologyDescription(topologyDescription));
  }

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
    store.dispatch(changeDataService(dataService));
    dataService.on('topologyDescriptionChanged', (evt) => {
      onTopologyDescriptionChanged(evt.newDescription);
    });

    const topologyDescription = dataService.getLastSeenTopology();
    if (topologyDescription !== null) {
      onTopologyDescriptionChanged(topologyDescription);
    }

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
    onInstanceStatusChange(instance, instance.status);

    instance.on('change:status', (instance, newStatus) => {
      onInstanceStatusChange(instance, newStatus);
    });

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

  // TODO: replace withomething?
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
