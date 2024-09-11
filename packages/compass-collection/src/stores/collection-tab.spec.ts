import type { CollectionTabOptions } from './collection-tab';
import { activatePlugin } from './collection-tab';
import { selectTab } from '../modules/collection-tab';
import { waitFor } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';
import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';

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
  tabId: 'workspace-tab-id',
  namespace: defaultMetadata.namespace,
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

  const localAppRegistry = sandbox.spy(new AppRegistry());
  const dataService = {} as any;
  let store: ReturnType<typeof activatePlugin>['store'];
  let deactivate: ReturnType<typeof activatePlugin>['deactivate'];

  const configureStore = async (
    options: Partial<CollectionTabOptions> = {},
    workspaces: Partial<ReturnType<typeof workspacesServiceLocator>> = {}
  ) => {
    ({ store, deactivate } = activatePlugin(
      {
        ...defaultTabOptions,
        ...options,
      },
      {
        dataService,
        localAppRegistry,
        collection: mockCollection as any,
        workspaces: workspaces as any,
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
      const openCollectionWorkspaceSubtab = sandbox.spy();
      const store = await configureStore(undefined, {
        openCollectionWorkspaceSubtab,
      });
      store.dispatch(selectTab('Documents'));
      expect(openCollectionWorkspaceSubtab).to.have.been.calledWith(
        'workspace-tab-id',
        'Documents'
      );
    });
  });
});
