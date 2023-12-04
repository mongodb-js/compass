import { expect } from 'chai';
import { activateWorkspacePlugin } from '../index';
import * as workspacesSlice from './workspaces';

describe('tabs behavior', function () {
  const instance = { on() {}, removeListener() {} } as any;
  const globalAppRegistry = { on() {}, removeListener() {} } as any;
  const helpers = { on() {}, cleanup() {} } as any;

  function configureStore() {
    return activateWorkspacePlugin({}, { globalAppRegistry, instance }, helpers)
      .store;
  }

  function openTabs(
    store: ReturnType<typeof configureStore>,
    namespaces: string[] = ['test.foo', 'test.bar', 'test.buz']
  ) {
    namespaces.forEach((namespace) => {
      store.dispatch(
        openWorkspace({ type: 'Collection', namespace } as any, {
          newTab: true,
        })
      );
    });
  }

  const {
    openWorkspace,
    openTabFromCurrent,
    selectTab,
    selectNextTab,
    selectPrevTab,
    moveTab,
    closeTab,
    collectionRenamed,
    collectionRemoved,
    databaseRemoved,
  } = workspacesSlice;

  describe('openWorkspace', function () {
    it('should open a tab and make it active', function () {
      const store = configureStore();
      store.dispatch(openWorkspace({ type: 'My Queries' }));
      const state = store.getState();
      expect(state).to.have.property('tabs').have.lengthOf(1);
      expect(state).to.have.nested.property('tabs[0].type', 'My Queries');
      expect(state).to.have.property('activeTabId', state.tabs[0].id);
    });

    it('should open a workspace in new tab even if another exists', function () {
      const store = configureStore();
      store.dispatch(openWorkspace({ type: 'My Queries' }));
      store.dispatch(openWorkspace({ type: 'My Queries' }, { newTab: true }));
      const state = store.getState();
      expect(state).to.have.property('tabs').have.lengthOf(2);
      expect(state).to.have.nested.property('tabs[0].type', 'My Queries');
      expect(state).to.have.nested.property('tabs[1].type', 'My Queries');
      expect(state).to.have.property('activeTabId', state.tabs[1].id);
    });

    it('should select already opened tab when trying to open a new one with the same attributes', function () {
      const store = configureStore();
      openTabs(store);
      const currentState = store.getState();

      // opening literally the same tab, state is not changed
      store.dispatch(
        openWorkspace({ type: 'Collection', namespace: 'test.buz' } as any)
      );
      expect(store.getState()).to.eq(currentState);

      // opening an existing tab changes the active id, but doesn't change the
      // tabs array
      store.dispatch(
        openWorkspace({ type: 'Collection', namespace: 'test.foo' } as any)
      );
      expect(store.getState()).to.have.property('tabs', currentState.tabs);
      expect(store.getState()).to.have.property(
        'activeTabId',
        currentState.tabs[0].id
      );
    });

    it('should not change any state when opening a workspace for the active tab even if other similar workspaces are open', function () {
      const store = configureStore();
      openTabs(store, ['db.coll', 'db.coll', 'db.coll']);
      const currentState = store.getState();
      store.dispatch(
        openWorkspace({ type: 'Collection', namespace: 'db.coll' } as any)
      );
      expect(store.getState()).to.eq(currentState);
    });
  });

  describe('openTabFromCurrent', function () {
    it('should open a tab that copies current active tab', function () {
      const store = configureStore();
      openTabs(store);
      const currentActiveTab = workspacesSlice.getActiveTab(store.getState());
      store.dispatch(openTabFromCurrent());
      const state = store.getState();
      const newActiveTab = workspacesSlice.getActiveTab(state);
      expect(newActiveTab).to.not.eq(currentActiveTab);
      expect(state).to.have.property('tabs').have.lengthOf(4);
      expect(state).to.have.nested.property(
        'tabs[3].namespace',
        currentActiveTab?.namespace
      );
      expect(state).to.have.property('activeTabId', newActiveTab?.id);
    });
  });

  describe('selectTab', function () {
    it('should select tab by index', function () {
      const store = configureStore();
      openTabs(store);
      store.dispatch(selectTab(0));
      const state = store.getState();
      expect(state).to.have.property('activeTabId', state.tabs[0].id);
      store.dispatch(selectTab(0));
      expect(store.getState()).to.eq(state);
    });
  });

  describe('selectNextTab', function () {
    it('should select next tab', function () {
      const store = configureStore();
      openTabs(store);
      store.dispatch(selectNextTab());
      const state1 = store.getState();
      expect(state1).to.have.property('activeTabId', state1.tabs[0].id);
      store.dispatch(selectNextTab());
      const state2 = store.getState();
      expect(state2).to.have.property('activeTabId', state2.tabs[1].id);
      store.dispatch(selectNextTab());
      const state3 = store.getState();
      expect(state3).to.have.property('activeTabId', state3.tabs[2].id);
      store.dispatch(selectNextTab());
      const state4 = store.getState();
      expect(state4).to.have.property('activeTabId', state4.tabs[0].id);
    });
  });

  describe('selectPrevTab', function () {
    it('should select previous tab', function () {
      const store = configureStore();
      openTabs(store);
      store.dispatch(selectPrevTab());
      const state1 = store.getState();
      expect(state1).to.have.property('activeTabId', state1.tabs[1].id);
      store.dispatch(selectPrevTab());
      const state2 = store.getState();
      expect(state2).to.have.property('activeTabId', state2.tabs[0].id);
      store.dispatch(selectPrevTab());
      const state3 = store.getState();
      expect(state3).to.have.property('activeTabId', state3.tabs[2].id);
      store.dispatch(selectPrevTab());
      const state4 = store.getState();
      expect(state4).to.have.property('activeTabId', state4.tabs[1].id);
    });
  });

  describe('moveTab', function () {
    it('should move tab from one index to another and preserve active tab id', function () {
      const store = configureStore();
      openTabs(store);
      const currentActiveTab = workspacesSlice.getActiveTab(store.getState());
      store.dispatch(moveTab(2, 0));
      const state = store.getState();
      expect(state).to.have.property('activeTabId', currentActiveTab?.id);
      expect(state).to.have.nested.property('tabs[0]', currentActiveTab);
    });
  });

  describe('closeTab', function () {
    it('should close tab and make another tab active if needed', function () {
      const store = configureStore();
      openTabs(store);
      const currentActiveTab = workspacesSlice.getActiveTab(store.getState());
      // closing inactive tab
      store.dispatch(closeTab(0));
      const state1 = store.getState();
      expect(state1).to.have.property('tabs').have.lengthOf(2);
      // active tab didn't change
      expect(state1).to.have.property('activeTabId', currentActiveTab?.id);
      // closing active tab
      store.dispatch(closeTab(1));
      const state2 = store.getState();
      expect(state2).to.have.property('tabs').have.lengthOf(1);
      // another tab was selected
      expect(state2)
        .to.have.property('activeTabId')
        .not.eq(currentActiveTab?.id);
    });
  });

  describe('collectionRenamed', function () {
    it('should not change state if no tabs were renamed', function () {
      const store = configureStore();
      openTabs(store);
      const state = store.getState();
      store.dispatch(collectionRenamed('foo.bar', 'foo.buz'));
      expect(store.getState()).to.eq(state);
    });

    it('should replace applicable tabs with the new namespace', function () {
      const store = configureStore();
      openTabs(store);
      const tabToRename = store
        .getState()
        .tabs.find((tab) => tab.namespace === 'test.foo');
      store.dispatch(collectionRenamed('test.foo', 'test.new-foo'));
      const state = store.getState();
      expect(state.tabs.find((tab) => tab.namespace === 'test.foo')).to.not
        .exist;
      const renamed = state.tabs.find(
        (tab) => tab.namespace === 'test.new-foo'
      );
      expect(renamed).to.exist;
      expect(renamed).to.not.eq(tabToRename);
    });
  });

  describe('collectionRemoved', function () {
    it('should not change state if no tabs were removed', function () {
      const store = configureStore();
      openTabs(store);
      const state = store.getState();
      store.dispatch(collectionRenamed('foo.bar', 'foo.buz'));
      expect(store.getState()).to.eq(state);
    });

    it('should remove all tabs with matching namespace', function () {
      const store = configureStore();
      openTabs(store);
      store.dispatch(collectionRemoved('test.foo'));
      const state = store.getState();
      expect(state).to.have.property('tabs').have.lengthOf(2);
      expect(state.tabs.find((tab) => tab.namespace === 'test.foo')).to.not
        .exist;
    });
  });

  describe('databaseRemoved', function () {
    it('should not change state if no tabs were removed', function () {
      const store = configureStore();
      openTabs(store);
      const state = store.getState();
      store.dispatch(collectionRenamed('foo.bar', 'foo.buz'));
      expect(store.getState()).to.eq(state);
    });

    it('should remove all tabs with matching namespace', function () {
      const store = configureStore();
      openTabs(store);
      store.dispatch(openWorkspace({ type: 'Collections', namespace: 'test' }));
      store.dispatch(openWorkspace({ type: 'My Queries' }));
      const myQueriesTab = workspacesSlice.getActiveTab(store.getState());
      store.dispatch(databaseRemoved('test'));
      const state = store.getState();
      expect(state).to.have.property('tabs').have.lengthOf(1);
      expect(state).to.have.property('tabs').deep.eq([myQueriesTab]);
    });

    it('should remove all tabs completely if all of them match namespace', function () {
      const store = configureStore();
      openTabs(store);
      store.dispatch(databaseRemoved('test'));
      const state = store.getState();
      expect(state).to.have.property('tabs').have.lengthOf(0);
      expect(state).to.have.property('tabs').deep.eq([]);
      expect(state).to.have.property('activeTabId', null);
    });
  });
});
