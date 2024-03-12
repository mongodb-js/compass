import type { CollectionTabOptions } from './collection-tab';
import { activatePlugin } from './collection-tab';
import { selectTab } from '../modules/collection-tab';
import { waitFor } from '@testing-library/react';
import Sinon from 'sinon';
import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';

const defaultMetadata = {
  namespace: 'test.foo',
  isReadonly: false,
  isTimeSeries: false,
  isClustered: false,
  isFLE: false,
  isSearchIndexesSupported: false,
  sourceName: 'test.bar',
};

const defaultTabOptions = {
  namespace: defaultMetadata.namespace,
  subTab: 'Documents',
};

const mockCollection = {
  _id: defaultMetadata.namespace,
  fetchMetadata() {
    return Promise.resolve(defaultMetadata);
  },
  toJSON() {
    return this;
  },
};

describe('Collection Tab Content store', function () {
  const sandbox = Sinon.createSandbox();

  const globalAppRegistry = sandbox.spy(new AppRegistry());
  const localAppRegistry = sandbox.spy(new AppRegistry());
  const dataService = {} as any;
  const instance = {
    databases: {
      get() {
        return {
          collections: {
            get() {
              return mockCollection;
            },
          },
        };
      },
    },
    dataLake: {},
    build: {},
    removeListener() {},
  } as any;
  let store: ReturnType<typeof activatePlugin>['store'];
  let deactivate: ReturnType<typeof activatePlugin>['deactivate'];

  const configureStore = async (
    options: Partial<CollectionTabOptions> = {}
  ) => {
    ({ store, deactivate } = activatePlugin(
      {
        ...defaultTabOptions,
        ...options,
      } as any,
      {
        dataService,
        globalAppRegistry,
        localAppRegistry,
        instance,
      },
      { on() {}, cleanup() {} } as any
    ));
    await waitFor(() => {
      expect(store.getState())
        .to.have.property('metadata')
        .deep.eq(defaultMetadata);
    });
    return store;
  };

  afterEach(function () {
    sandbox.resetHistory();
    deactivate();
  });

  describe('selectTab', function () {
    it('should set active tab', async function () {
      const store = await configureStore();
      store.dispatch(selectTab('Documents'));
      expect(store.getState()).to.have.property('currentTab', 'Documents');
    });
  });
});
