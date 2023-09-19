import { expect } from 'chai';
import { configureStore } from './tabs';
import {
  openCollection,
  openCollectionInNewTab,
  openNewTabForCurrentCollection,
  selectNextTab,
  selectPreviousTab,
  selectTabByIndex,
  moveTabByIndex,
  closeTabAtIndex,
  getActiveTab,
  databaseDropped,
  collectionDropped,
} from '../modules/tabs';
import Sinon from 'sinon';
import AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';

describe('Collection Tabs Store', function () {
  const sandbox = Sinon.createSandbox();
  const globalAppRegistry = sandbox.spy(new AppRegistry());
  const dataService = sandbox.spy({
    isConnected() {
      return true;
    },
  } as DataService);
  const CollectionTabRole = {
    name: 'CollectionTab',
    component: () => null,
    configureStore: sandbox.stub().returns({
      getState() {
        return { currentTab: 'Documents' };
      },
    }),
  };

  before(function () {
    globalAppRegistry.registerRole('CollectionTab.Content', CollectionTabRole);
  });

  afterEach(function () {
    sandbox.resetHistory();
  });

  describe('openCollectionInNewTab', function () {
    it('should set up new collection tab', function () {
      const store = configureStore({ globalAppRegistry, dataService });
      store.dispatch(openCollectionInNewTab({ namespace: 'test.foo' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.bar' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.buz' } as any));

      const state = store.getState();

      expect(state).to.have.property('tabs').have.lengthOf(3);
      expect(state.tabs.map((tab) => tab.namespace)).to.deep.eq([
        'test.foo',
        'test.bar',
        'test.buz',
      ]);
      expect(state.tabs[0].localAppRegistry).not.eq(
        state.tabs[1].localAppRegistry
      );
      expect(state.tabs[0].localAppRegistry).not.eq(
        state.tabs[2].localAppRegistry
      );
      expect(state.tabs[1].localAppRegistry).not.eq(
        state.tabs[2].localAppRegistry
      );
      expect(CollectionTabRole.configureStore).to.have.been.calledThrice;
    });
  });

  describe('openCollection', function () {
    it('should open collection in the same tab', function () {
      const store = configureStore({ globalAppRegistry, dataService });

      store.dispatch(openCollection({ namespace: 'test.foo' } as any));
      expect(store.getState()).to.have.property('tabs').have.lengthOf(1);
      expect(store.getState()).to.have.nested.property(
        'tabs[0].namespace',
        'test.foo'
      );

      store.dispatch(openCollection({ namespace: 'test.bar' } as any));
      expect(store.getState()).to.have.property('tabs').have.lengthOf(1);
      expect(store.getState()).to.have.nested.property(
        'tabs[0].namespace',
        'test.bar'
      );

      store.dispatch(openCollection({ namespace: 'test.buz' } as any));
      expect(store.getState()).to.have.property('tabs').have.lengthOf(1);
      expect(store.getState()).to.have.nested.property(
        'tabs[0].namespace',
        'test.buz'
      );
    });

    it('should do nothing when opening tab for the same namespace as the active tab', function () {
      const store = configureStore({ globalAppRegistry, dataService });
      store.dispatch(openCollection({ namespace: 'test.foo' } as any));
      const stateWithOneTab = store.getState();

      store.dispatch(openCollection({ namespace: 'test.foo' } as any));
      store.dispatch(openCollection({ namespace: 'test.foo' } as any));
      store.dispatch(openCollection({ namespace: 'test.foo' } as any));

      expect(store.getState()).to.eq(stateWithOneTab);
    });
  });

  describe('openNewTabForCurrentCollection', function () {
    it('should emit an event to open new tab with the same namespace as the active tab', function () {
      const store = configureStore({ globalAppRegistry, dataService });
      store.dispatch(openCollection({ namespace: 'test.foo' } as any));
      store.dispatch(openNewTabForCurrentCollection());
      expect(globalAppRegistry.emit).to.have.been.calledWith(
        'collection-workspace-open-collection-in-new-tab',
        { ns: 'test.foo' }
      );
    });
  });

  describe('selectNextTab', function () {
    it('should select next tab circular', function () {
      const store = configureStore({ globalAppRegistry, dataService });
      store.dispatch(openCollectionInNewTab({ namespace: 'test.foo' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.bar' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.buz' } as any));

      store.dispatch(selectNextTab());
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'test.foo'
      );

      store.dispatch(selectNextTab());
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'test.bar'
      );

      store.dispatch(selectNextTab());
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'test.buz'
      );

      store.dispatch(selectNextTab());
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'test.foo'
      );
    });
  });

  describe('selectPreviousTab', function () {
    it('should select previous tab circular', function () {
      const store = configureStore({ globalAppRegistry, dataService });
      store.dispatch(openCollectionInNewTab({ namespace: 'test.foo' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.bar' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.buz' } as any));

      store.dispatch(selectPreviousTab());
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'test.bar'
      );

      store.dispatch(selectPreviousTab());
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'test.foo'
      );

      store.dispatch(selectPreviousTab());
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'test.buz'
      );

      store.dispatch(selectPreviousTab());
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'test.bar'
      );
    });
  });

  describe('selectTabByIndex', function () {
    it('should select tab by index', function () {
      const store = configureStore({ globalAppRegistry, dataService });
      store.dispatch(openCollectionInNewTab({ namespace: 'test.foo' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.bar' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.buz' } as any));

      store.dispatch(selectTabByIndex(0));
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'test.foo'
      );

      store.dispatch(selectTabByIndex(1));
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'test.bar'
      );

      store.dispatch(selectTabByIndex(2));
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'test.buz'
      );
    });
  });

  describe('moveTabByIndex', function () {
    it('should move tab by index without changing active tab', function () {
      const store = configureStore({ globalAppRegistry, dataService });
      store.dispatch(openCollectionInNewTab({ namespace: 'test.foo' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.bar' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.buz' } as any));

      store.dispatch(moveTabByIndex(2, 0));
      expect(
        store.getState().tabs.map((tab) => {
          return tab.namespace;
        })
      ).to.deep.eq(['test.buz', 'test.foo', 'test.bar']);
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'test.buz'
      );
    });
  });

  describe('closeTabAtIndex', function () {
    it('should remove the tab on close', function () {
      const store = configureStore({ globalAppRegistry, dataService });
      store.dispatch(openCollectionInNewTab({ namespace: 'test.foo' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.bar' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.buz' } as any));
      store.dispatch(closeTabAtIndex(0));
      expect(
        store.getState().tabs.map((tab) => {
          return tab.namespace;
        })
      ).to.deep.eq(['test.bar', 'test.buz']);
    });

    it("should emit 'select-database' when last tab is closed", function () {
      const store = configureStore({ globalAppRegistry, dataService });
      store.dispatch(openCollectionInNewTab({ namespace: 'test.foo' } as any));
      store.dispatch(closeTabAtIndex(0));
      expect(store.getState().tabs).to.have.lengthOf(0);
      expect(globalAppRegistry.emit).to.have.been.calledWith(
        'select-database',
        'test'
      );
    });
  });

  describe('databaseDropped', function () {
    it('should remove all tabs with dropped database', function () {
      const store = configureStore({ globalAppRegistry, dataService });
      store.dispatch(openCollectionInNewTab({ namespace: 'test.foo' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.bar' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'meow.buz' } as any));
      store.dispatch(databaseDropped('test'));
      expect(
        store.getState().tabs.map((tab) => {
          return tab.namespace;
        })
      ).to.deep.eq(['meow.buz']);
    });

    it("should emit 'active-database-dropped' when action closes all open tabs", function () {
      const store = configureStore({ globalAppRegistry, dataService });
      store.dispatch(openCollectionInNewTab({ namespace: 'test.foo' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.bar' } as any));
      store.dispatch(databaseDropped('test'));
      expect(store.getState().tabs).to.have.lengthOf(0);
      expect(globalAppRegistry.emit).to.have.been.calledWith(
        'active-database-dropped',
        'test'
      );
    });
  });

  describe('collectionDropped', function () {
    it('should remove all tabs with dropped collection', function () {
      const store = configureStore({ globalAppRegistry, dataService });
      store.dispatch(openCollectionInNewTab({ namespace: 'test.foo' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.foo' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'meow.buz' } as any));
      store.dispatch(collectionDropped('test.foo'));
      expect(
        store.getState().tabs.map((tab) => {
          return tab.namespace;
        })
      ).to.deep.eq(['meow.buz']);
    });

    it("should emit 'active-collection-dropped' when action closes all open tabs", function () {
      const store = configureStore({ globalAppRegistry, dataService });
      store.dispatch(openCollectionInNewTab({ namespace: 'test.foo' } as any));
      store.dispatch(openCollectionInNewTab({ namespace: 'test.foo' } as any));
      store.dispatch(collectionDropped('test.foo'));
      expect(store.getState().tabs).to.have.lengthOf(0);
      expect(globalAppRegistry.emit).to.have.been.calledWith(
        'active-collection-dropped',
        'test.foo'
      );
    });
  });
});
