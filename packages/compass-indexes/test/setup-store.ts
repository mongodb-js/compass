import { EventEmitter } from 'events';
import Sinon from 'sinon';
import type AppRegistry from 'hadron-app-registry';
import type {
  IndexesDataService,
  IndexesPluginOptions,
  IndexesPluginServices,
} from '../src/stores/store';
import { activateIndexesPlugin } from '../src/stores/store';
import { createActivateHelpers } from 'hadron-app-registry';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import type { ConnectionInfo } from '../../connection-info/dist';
import type { ConnectionInfoAccess } from '@mongodb-js/compass-connections/provider';

const NOOP_DATA_PROVIDER: IndexesDataService = {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getSearchIndexes(ns: string) {
    return Promise.resolve([]);
  },
  createSearchIndex(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ns: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    description: {
      name: string;
      definition: any;
      type: string;
    }
  ) {
    return Promise.resolve('new-id');
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateSearchIndex(ns: string, name: string, spec: any) {
    return Promise.resolve();
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dropSearchIndex(ns: string, name: string) {
    return Promise.resolve();
  },
};

class FakeInstance extends EventEmitter {
  isWritable = true;
  description = 'initial description';
}

const fakeInstance = new FakeInstance();

export const setupStore = (
  options: Partial<IndexesPluginOptions> = {},
  dataProvider: Partial<IndexesDataService> = NOOP_DATA_PROVIDER,
  services: Partial<IndexesPluginServices> = {}
) => {
  const localAppRegistry = {
    on: Sinon.spy(),
    emit: Sinon.spy(),
  } as unknown as AppRegistry;
  const globalAppRegistry = {
    on: Sinon.spy(),
    emit: Sinon.spy(),
    getStore: Sinon.spy(),
  } as unknown as AppRegistry;

  const connectionInfoAccess: ConnectionInfoAccess = {
    getCurrentConnectionInfo: () => ({ id: 'TEST' } as ConnectionInfo),
  };

  return activateIndexesPlugin(
    {
      namespace: 'citibike.trips',
      serverVersion: '6.0.0',
      isReadonly: false,
      isSearchIndexesSupported: false,
      ...options,
    },
    {
      dataService: { ...NOOP_DATA_PROVIDER, ...dataProvider },
      globalAppRegistry,
      localAppRegistry,
      instance: fakeInstance as any,
      logger: createNoopLogger('TEST'),
      track: createNoopTrack(),
      connectionInfoAccess,
      ...services,
    },
    createActivateHelpers()
  ).store;
};
