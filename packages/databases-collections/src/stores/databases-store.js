import throttle from 'lodash/throttle';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import { appRegistryActivated } from '../modules/app-registry';
import { setDatabases } from '../modules/databases/databases';
import { databasesStatusChanged } from '../modules/databases/status';
import { writeStateChanged } from '../modules/is-writable';
import { toggleIsGenuineMongoDB } from '../modules/is-genuine-mongodb';
import { toggleIsDataLake } from '../modules/is-data-lake';
import { reset } from '../modules/reset';
import { databasesReducer } from '../modules';
import { preferencesReadOnlyChanged } from '../modules/preferences-readonly';
import preferences from 'compass-preferences-model';

const store = createStore(databasesReducer, applyMiddleware(thunk));

store.onActivated = (appRegistry) => {
  const onDatabasesChange = throttle((dbs) => {
    store.dispatch(setDatabases(dbs.toJSON()));
  }, 300);

  store.dispatch(preferencesReadOnlyChanged(!!preferences.getPreferences().readOnly));
  preferences.onPreferenceValueChanged('readOnly', (readOnly) => {
    store.dispatch(preferencesReadOnlyChanged(readOnly));
  });

  appRegistry.on('instance-destroyed', () => {
    onDatabasesChange.cancel();
    store.dispatch(reset());
  });

  /**
   * Sort the databases once the instance is refreshed.
   *
   * @param {Object} state - The instance store state.
   */
  appRegistry.on('instance-created', ({ instance }) => {
    store.dispatch(databasesStatusChanged(instance));
    onDatabasesChange(instance.databases);

    store.dispatch(toggleIsGenuineMongoDB(instance.genuineMongoDB.isGenuine));

    instance.genuineMongoDB.on('change:isGenuine', (model, newVal) => {
      store.dispatch(toggleIsGenuineMongoDB(newVal));
    });

    store.dispatch(toggleIsDataLake(instance.dataLake.isDataLake));

    instance.dataLake.on('change:isDataLake', (model, newVal) => {
      store.dispatch(toggleIsDataLake(newVal));
    });

    store.dispatch(databasesStatusChanged(instance.databasesStatus));

    instance.on('change:databasesStatus', () => {
      store.dispatch(databasesStatusChanged(instance));
      onDatabasesChange(instance.databases);
    });

    onDatabasesChange(instance.databases);

    instance.on('change:databases.status', () => {
      onDatabasesChange(instance.databases);
    });

    store.dispatch(writeStateChanged({ isWritable: instance.isWritable }));
    instance.on('change:isWritable', () => {
      store.dispatch(writeStateChanged({ isWritable: instance.isWritable }));
    });
  });

  /**
   * Set the app registry to use later.
   */
  store.dispatch(appRegistryActivated(appRegistry));
};

export default store;
