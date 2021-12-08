import throttle from 'lodash/throttle';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { appRegistryActivated } from '../modules/app-registry';
import { changeDatabaseName } from '../modules/database-name';
import { dataServiceConnected } from '../modules/data-service';
import { loadCollections } from '../modules/collections/collections';
import { writeStateChanged } from '../modules/is-writable';
import { toggleIsDataLake } from '../modules/is-data-lake';
import { collectionsReducer } from '../modules';

const store = createStore(collectionsReducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  const onCollectionsChange = throttle((collections, force = false) => {
    const { databaseName } = store.getState();
    if (collections.parent.getId() === databaseName) {
      if (process.env.COMPASS_NO_GLOBAL_OVERLAY !== 'true') {
        const shouldUpdate = force || !collections.some((coll) =>
          ['fetching', 'refreshing'].includes(coll.status)
        );
        if (shouldUpdate) {
          store.dispatch(loadCollections(collections.toJSON()));
        }
      } else {
        store.dispatch(loadCollections(collections.toJSON()));
      }
    }
  }, 100);

  appRegistry.on('instance-destroyed', () => {
    onCollectionsChange.cancel();
    store.instance = null;
  });

  /**
   * Sort the collections once the instance is refreshed.
   *
   * @param {Object} state - The instance store state.
   */
  appRegistry.on('instance-created', ({ instance }) => {
    store.instance = instance;

    instance.on('change:databases.collectionsStatus', (model) => {
      onCollectionsChange(model.collections);
    });

    instance.on('change:collections.status', (model) => {
      // This is not a typo. Here `collection` is a reference to the ampersand
      // collection that holds references to all collection models on the
      // database. Above `collections` is a reference the collections property
      // on the database model
      onCollectionsChange(model.collection);
    });

    instance.dataLake.on('change:isDataLake', (model, isDataLake) => {
      store.dispatch(toggleIsDataLake(isDataLake));
    });
  });

  /**
   * When the database changes load the collections.
   *
   * @param {String} ns - The namespace.
   */
  appRegistry.on('select-database', (ns) => {
    const { databaseName } = store.getState();
    if (ns !== databaseName) {
      store.dispatch(changeDatabaseName(ns));
      onCollectionsChange(
        store.instance?.databases.get(ns)?.collections ?? [],
        true
      );
    }
  });

  /**
   * When write state changes based on SDAM events we change the store state.
   *
   * @param {Object} state - The write state store state.
   */
  appRegistry.getStore('DeploymentAwareness.WriteStateStore').listen((state) => {
    store.dispatch(writeStateChanged(state));
  });

  /**
   * Set the data service in the store when connected.
   *
   * @param {Error} error - The error.
   * @param {DataService} dataService - The data service.
   */
  appRegistry.on('data-service-connected', (error, dataService) => {
    store.dispatch(dataServiceConnected(error, dataService));
  });

  /**
   * Set the app registry to use later.
   */
  store.dispatch(appRegistryActivated(appRegistry));
};

export default store;
