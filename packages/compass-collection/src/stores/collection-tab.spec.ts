import type { CollectionTabOptions } from './collection-tab';
import { activatePlugin } from './collection-tab';
import { waitFor } from '@testing-library/react';
import Sinon from 'sinon';
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
  subTab: 'Documents' as const,
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
      },
      {
        dataService,
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

  it('sets the namespace', async function () {
    const store = await configureStore();
    expect(store.getState()).to.have.property(
      'namespace',
      defaultMetadata.namespace
    );
  });
});
