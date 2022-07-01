import throttle from 'lodash/throttle';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { appRegistryActivated } from '../modules/app-registry';
import { changeDatabaseName } from '../modules/database-name';
import { dataServiceConnected } from '../modules/data-service';
import { setCollections } from '../modules/collections/collections';
import { collectionsStatusChanged } from '../modules/collections/status';
import { writeStateChanged } from '../modules/is-writable';
import { toggleIsDataLake } from '../modules/is-data-lake';
import { reset } from '../modules/reset';
import { collectionsReducer } from '../modules';

const store = createStore(collectionsReducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  const onCollectionsChange = throttle((collections) => {
    const { databaseName } = store.getState();
    if (collections.parent.getId() === databaseName) {
      store.dispatch(setCollections(collections.toJSON()));
    }
  }, 300);

  const onDatabaseCollectionStatusChange = (dbModel) => {
    store.dispatch(collectionsStatusChanged(dbModel));
    onCollectionsChange(dbModel.collections);
  };

  const onDatabaseCollectionsChange = (collModel) => {
    // This is not a typo. Here `collection` is a reference to the ampersand
    // collection that holds references to all collection models on the
    // database. Above `collections` is a reference the collections property
    // on the database model
    onCollectionsChange(collModel.collection);
  };

  const onSelectDatabase = (ns) => {
    const { databaseName } = store.getState();

    if (ns === databaseName) {
      return;
    }

    const prevDb = store.instance?.databases.get(databaseName);
    const nextDb = store.instance?.databases.get(ns);

    if (!nextDb) {
      throw new Error(`Database ${ns} does not exist`);
    }

    /* eslint-disable chai-friendly/no-unused-expressions */
    // Clean up listeners from previous database model (if exists) and set up
    // new ones
    prevDb?.off('change:collectionsStatus', onDatabaseCollectionStatusChange);
    nextDb.on('change:collectionsStatus', onDatabaseCollectionStatusChange);
    prevDb?.off('change:collections.status', onDatabaseCollectionsChange);
    nextDb.on('change:collections.status', onDatabaseCollectionsChange);
    /* eslint-enable chai-friendly/no-unused-expressions */

    // Cancel any pending collection change handlers as they are definitely from
    // the previous db
    onCollectionsChange.cancel();
    // Set initial collections based on the current database model state and
    // update the collections collection status
    store.dispatch(changeDatabaseName(ns, nextDb.collections.toJSON() ?? []));
    onDatabaseCollectionStatusChange(nextDb);
  };

  appRegistry.on('instance-destroyed', () => {
    onCollectionsChange.cancel();
    store.dispatch(reset());
    store.instance = null;
  });

  /**
   * Sort the collections once the instance is refreshed.
   *
   * @param {Object} state - The instance store state.
   */
  appRegistry.on('instance-created', ({ instance }) => {
    store.instance = instance;

    store.dispatch(toggleIsDataLake(instance.dataLake.isDataLake));

    instance.dataLake.on('change:isDataLake', (model, isDataLake) => {
      store.dispatch(toggleIsDataLake(isDataLake));
    });
  });

  /**
   * When the database changes load the collections.
   *
   * @param {String} ns - The namespace.
   */
  appRegistry.on('select-database', onSelectDatabase);

  /**
   * When write state changes based on SDAM events we change the store state.
   *
   * @param {Object} state - The write state store state.
   */
  // TODO: replace with something
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
