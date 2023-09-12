import Sinon from 'sinon';
import type AppRegistry from 'hadron-app-registry';
import type {
  ConfigureStoreOptions,
  IndexesDataService,
} from '../src/stores/store';
import configureStore from '../src/stores/store';

export const setupStore = (options: Partial<ConfigureStoreOptions> = {}) => {
  const localAppRegistry = {
    on: Sinon.spy(),
    emit: Sinon.spy(),
  } as unknown as AppRegistry;
  const globalAppRegistry = {
    on: Sinon.spy(),
    emit: Sinon.spy(),
    getStore: Sinon.spy(),
  } as unknown as AppRegistry;

  const dataProvider: IndexesDataService = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    indexes(ns: string, options: any) {
      return Promise.resolve([]);
    },
    isConnected() {
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateCollection(ns: string, flags: any) {
      return Promise.resolve({});
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createIndex(ns, spec, options) {
      return Promise.resolve('ok');
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dropIndex(ns, name) {
      return Promise.resolve({});
    },
  };

  return configureStore({
    namespace: 'citibike.trips',
    dataProvider: {
      dataProvider: dataProvider,
    },
    serverVersion: '6.0.0',
    isReadonly: false,
    isSearchIndexesSupported: false,
    globalAppRegistry,
    localAppRegistry,
    ...options,
  });
};
