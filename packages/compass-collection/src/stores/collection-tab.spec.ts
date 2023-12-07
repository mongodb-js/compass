import type { CollectionTabOptions } from './collection-tab';
import { activatePlugin } from './collection-tab';
import {
  selectTab,
  selectDatabase,
  editView,
  renderScopedModals,
  renderTabs,
} from '../modules/collection-tab';
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

  const scopedModalRole = {
    name: 'ScopedModal',
    component: () => 'ScopedModalComponent',
    configureStore: sandbox.stub().returns({}),
    storeName: 'ScopedModalStore',
    configureActions: sandbox.stub().returns({}),
    actionName: 'ScopedModalAction',
  };

  const collectionSubTabRole = {
    name: 'CollectionSubTab',
    component: () => 'CollectionSubTabComponent',
    configureStore: sandbox.stub().returns({}),
    storeName: 'CollectionSubTabStore',
    configureActions: sandbox.stub().returns({}),
    actionName: 'CollectionSubTabAction',
  };

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
        globalAppRegistry,
        localAppRegistry,
        instance,
      },
      { on() {}, cleanup() {}, addCleanup() {} }
    ));
    await waitFor(() => {
      expect(store.getState())
        .to.have.property('metadata')
        .deep.eq(defaultMetadata);
    });
    return store;
  };

  beforeEach(function () {
    globalAppRegistry.registerRole(
      'Collection.ScopedModal',
      scopedModalRole as any
    );
    globalAppRegistry.registerRole(
      'Collection.Tab',
      collectionSubTabRole as any
    );
  });

  afterEach(function () {
    globalAppRegistry.roles = {};
    globalAppRegistry.stores = {};
    globalAppRegistry.actions = {};
    globalAppRegistry.components = {};

    localAppRegistry.roles = {};
    localAppRegistry.stores = {};
    localAppRegistry.actions = {};
    localAppRegistry.components = {};

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

  describe('selectDatabase', function () {
    it("should emit 'select-database' event", async function () {
      const store = await configureStore();
      store.dispatch(selectDatabase());
      expect(globalAppRegistry.emit).to.have.been.calledWith(
        'select-database',
        'test'
      );
    });
  });

  describe('editView', function () {
    it("should emit 'collection-tab-select-collection' event", async function () {
      const store = await configureStore();
      store.dispatch(editView());
      expect(globalAppRegistry.emit).to.have.been.calledWithMatch(
        'collection-tab-select-collection',
        { ns: 'test.bar' }
      );
    });
  });

  describe('renderScopedModals', function () {
    it('should set up scoped modals state in local app registry', async function () {
      const store = await configureStore();
      const modals = store.dispatch(renderScopedModals(defaultTabOptions));
      expect(modals.map((el) => (el as any).type())).to.deep.eq([
        'ScopedModalComponent',
      ]);
      expect(localAppRegistry.getStore('ScopedModalStore')).to.exist;
      expect(localAppRegistry.getAction('ScopedModalAction')).to.exist;
    });

    it('should only configure scoped modals store and actions once', async function () {
      const store = await configureStore();
      store.dispatch(renderScopedModals(defaultTabOptions));
      store.dispatch(renderScopedModals(defaultTabOptions));
      store.dispatch(renderScopedModals(defaultTabOptions));
      expect(scopedModalRole.configureStore).to.have.been.called.calledOnce;
      expect(scopedModalRole.configureActions).to.have.been.called.calledOnce;
    });
  });

  describe('renderTabs', function () {
    it('should set up tabs state in local app registry', async function () {
      const store = await configureStore();
      const tabs = store.dispatch(renderTabs(defaultTabOptions));
      expect(
        tabs.map((tab) => {
          return {
            name: tab.name,
            component: (tab.component as any).type(),
          };
        })
      ).to.deep.eq([
        { name: 'CollectionSubTab', component: 'CollectionSubTabComponent' },
      ]);
      expect(localAppRegistry.getStore('CollectionSubTabStore')).to.exist;
      expect(localAppRegistry.getAction('CollectionSubTabAction')).to.exist;
    });

    it('should only configure tabs store and actions once', async function () {
      const store = await configureStore();
      store.dispatch(renderTabs(defaultTabOptions));
      store.dispatch(renderTabs(defaultTabOptions));
      store.dispatch(renderTabs(defaultTabOptions));
      expect(collectionSubTabRole.configureStore).to.have.been.called
        .calledOnce;
      expect(collectionSubTabRole.configureActions).to.have.been.called
        .calledOnce;
    });
  });
});
