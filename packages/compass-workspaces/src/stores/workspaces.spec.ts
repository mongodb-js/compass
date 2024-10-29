import { expect } from 'chai';
import type { Workspace } from '../index';
import WorkspacesPlugin from '../index';
import type { activateWorkspacePlugin } from '../index';
import * as workspacesSlice from './workspaces';
import { _bulkTabsClose } from './workspaces';
import { TestMongoDBInstanceManager } from '@mongodb-js/compass-app-stores/provider';
import type { ConnectionInfo } from '../../../connection-info/dist';
import type { WorkspaceTab } from '../../dist';
import { setTabDestroyHandler } from '../components/workspace-close-handler';
import { createPluginTestHelpers } from '@mongodb-js/testing-library-compass';

type WorkspacesStore = ReturnType<typeof activateWorkspacePlugin>['store'];

describe('tabs behavior', function () {
  const { activatePluginWithConnections } = createPluginTestHelpers(
    WorkspacesPlugin.withMockServices({
      instancesManager: new TestMongoDBInstanceManager(),
    }),
    { onActiveWorkspaceTabChange: () => undefined }
  );

  function configureStore() {
    const result = activatePluginWithConnections();
    return result.plugin.store;
  }

  function openTabs(
    store: WorkspacesStore,
    connectionNamespaces: Record<ConnectionInfo['id'], string[]> = {
      connection1: ['test.foo', 'test.bar', 'test.buz'],
    }
  ) {
    for (const connectionId in connectionNamespaces) {
      connectionNamespaces[connectionId].forEach((namespace) => {
        store.dispatch(
          openWorkspace(
            { type: 'Collection', namespace, connectionId },
            {
              newTab: true,
            }
          )
        );
      });
    }
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
    connectionDisconnected,
    collectionSubtabSelected,
    openFallbackWorkspace: openFallbackTab,
    getActiveTab,
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

    it('should open the workspace over existing tab by default', function () {
      const store = configureStore();
      for (const ns of ['foo', 'bar', 'buz', 'bla']) {
        store.dispatch(
          openWorkspace({
            type: 'Collections',
            namespace: ns,
            connectionId: 'abc',
          })
        );
      }
      expect(store.getState()).to.have.property('tabs').have.lengthOf(1);
    });

    it('should open the workspace in new tab if any `replace` handlers returned `false`', function () {
      const store = configureStore();
      for (const ns of ['foo', 'bar', 'buz', 'bla']) {
        store.dispatch(
          openWorkspace({
            type: 'Collections',
            namespace: ns,
            connectionId: 'abc',
          })
        );
        setTabDestroyHandler('replace', store.getState().activeTabId!, () => {
          return false;
        });
      }
      expect(store.getState()).to.have.property('tabs').have.lengthOf(4);
    });

    it('when `newTab` is `true` should open a workspace in new tab even if another exists', function () {
      const store = configureStore();
      store.dispatch(openWorkspace({ type: 'My Queries' }));
      store.dispatch(openWorkspace({ type: 'My Queries' }, { newTab: true }));
      const state = store.getState();
      expect(state).to.have.property('tabs').have.lengthOf(2);
      expect(state).to.have.nested.property('tabs[0].type', 'My Queries');
      expect(state).to.have.nested.property('tabs[1].type', 'My Queries');
      expect(state).to.have.property('activeTabId', state.tabs[1].id);
    });

    it('when the connection differs from the active tab, it should open a workspace in new tab', function () {
      const store = configureStore();
      store.dispatch(
        openWorkspace({ type: 'Databases', connectionId: 'connectionA' })
      );
      store.dispatch(
        openWorkspace({ type: 'Databases', connectionId: 'connectionB' })
      );
      const state = store.getState();
      expect(state).to.have.property('tabs').have.lengthOf(2);
      expect(state).to.have.nested.property('tabs[0].type', 'Databases');
      expect(state).to.have.nested.property('tabs[1].type', 'Databases');
      expect(state).to.have.property('activeTabId', state.tabs[1].id);
    });

    it('should select already opened tab when trying to open a new one with the same attributes', function () {
      const store = configureStore();
      openTabs(store);
      const currentState1 = store.getState();

      // opening literally the same tab, state is not changed
      store.dispatch(
        openWorkspace({
          type: 'Collection',
          namespace: 'test.buz',
          connectionId: 'connection1',
        })
      );

      expect(store.getState()).to.eq(currentState1);

      // opening "My Queries" so that the current active workspace type is
      // different
      store.dispatch(openWorkspace({ type: 'My Queries' }));
      const currentState2 = store.getState();

      // opening an existing tab changes the active id, but doesn't change the
      // tabs array
      store.dispatch(
        openWorkspace({
          type: 'Collection',
          namespace: 'test.foo',
          connectionId: 'connection1',
        })
      );
      expect(store.getState()).to.have.property('tabs', currentState2.tabs);
      expect(store.getState()).to.have.property(
        'activeTabId',
        currentState2.tabs[0].id
      );
    });

    it('should not change any state when opening a workspace for the active tab even if other similar workspaces are open', function () {
      const store = configureStore();
      openTabs(store, { connection1: ['db.coll', 'db.coll', 'db.coll'] });
      const currentState = store.getState();
      store.dispatch(
        openWorkspace({
          type: 'Collection',
          namespace: 'db.coll',
          connectionId: 'connection1',
        })
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
        (currentActiveTab as any)?.namespace
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
    it('should close tab and make another tab active if needed', async function () {
      const store = configureStore();
      openTabs(store);
      const currentActiveTab = workspacesSlice.getActiveTab(store.getState());
      // closing inactive tab
      await store.dispatch(closeTab(0));
      const state1 = store.getState();
      expect(state1).to.have.property('tabs').have.lengthOf(2);
      // active tab didn't change
      expect(state1).to.have.property('activeTabId', currentActiveTab?.id);
      // closing active tab
      await store.dispatch(closeTab(1));
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
        .tabs.find(
          (tab) => tab.type === 'Collection' && tab.namespace === 'test.foo'
        );
      store.dispatch(collectionRenamed('test.foo', 'test.new-foo'));
      const state = store.getState();
      expect(
        state.tabs.find(
          (tab) => tab.type === 'Collection' && tab.namespace === 'test.foo'
        )
      ).to.not.exist;
      const renamed = state.tabs.find(
        (tab) => tab.type === 'Collection' && tab.namespace === 'test.new-foo'
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
      expect(
        state.tabs.find(
          (tab) => tab.type === 'Collection' && tab.namespace === 'test.foo'
        )
      ).to.not.exist;
    });
  });

  describe('databaseRemoved', function () {
    it('should not change state if no tabs were removed', function () {
      const store = configureStore();
      openTabs(store);
      const state = store.getState();

      store.dispatch(databaseRemoved('blah'));
      expect(store.getState()).to.eq(state);
    });

    it('should remove all tabs with matching namespace', function () {
      const store = configureStore();
      openTabs(store);
      store.dispatch(
        openWorkspace({
          type: 'Collections',
          connectionId: '1',
          namespace: 'test',
        })
      );
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

  describe('connectionDisconnected', function () {
    it('should not change state if no tabs were removed', function () {
      const store = configureStore();
      openTabs(store);
      const state = store.getState();
      store.dispatch(connectionDisconnected('otherConnection'));
      expect(store.getState()).to.eq(state);
    });

    it('should remove all tabs with matching connection', function () {
      const store = configureStore();
      openTabs(store, {
        connectionA: ['dbA', 'dbA.coll'],
        connectionB: ['dbB', 'dbB.coll'],
      });
      store.dispatch(connectionDisconnected('connectionA'));
      const state = store.getState();
      expect(state).to.have.property('tabs').have.lengthOf(2);
      expect(state).to.have.nested.property('tabs[0].namespace', 'dbB');
      expect(state).to.have.nested.property('tabs[1].namespace', 'dbB.coll');
    });

    it('when the active tab is removed, it should make the next tab active', function () {
      const store = configureStore();
      const connectionId = 'connectionA';
      const connectionTab: Pick<
        Workspace<'Databases'>,
        'type' | 'connectionId'
      > = {
        type: 'Databases',
        connectionId,
      };
      store.dispatch(openWorkspace(connectionTab));
      store.dispatch(openWorkspace({ type: 'My Queries' }, { newTab: true }));
      store.dispatch(selectPrevTab());

      expect(getActiveTab(store.getState())).to.have.property(
        'type',
        'Databases'
      );
      expect(getActiveTab(store.getState())).to.have.property(
        'connectionId',
        connectionId
      );

      store.dispatch(connectionDisconnected(connectionId));
      const state = store.getState();
      expect(state).to.have.property('tabs').have.lengthOf(1);
      expect(getActiveTab(state)).to.have.property('type', 'My Queries');
    });

    it('should remove all tabs completely if all of them belong to the connection', function () {
      const store = configureStore();
      openTabs(store);
      store.dispatch(connectionDisconnected('connection1'));
      const state = store.getState();
      expect(state).to.have.property('tabs').have.lengthOf(0);
      expect(state).to.have.property('tabs').deep.eq([]);
      expect(state).to.have.property('activeTabId', null);
    });
  });

  describe('collectionSubtabSelected', function () {
    it('should select collection subtab', function () {
      const store = configureStore();
      openTabs(store);

      const activeTabId = store.getState().activeTabId;

      store.getState().tabs.forEach(({ id }, index) => {
        store.dispatch(collectionSubtabSelected(id, 'Indexes'));
        expect(store.getState().tabs[index]).to.have.property(
          'subTab',
          'Indexes'
        );

        expect(
          store.getState().activeTabId,
          'it does not change active tab id'
        ).to.equal(activeTabId);
      });
    });
  });

  describe('openFallbackTab', function () {
    it('should replace the tab with a fallback namespace', function () {
      const store = configureStore();

      store.dispatch(
        openWorkspace({
          type: 'Collection',
          connectionId: '1',
          namespace: 'foo.bar',
        })
      );
      expect(store.getState().tabs).to.have.lengthOf(1);
      expect(getActiveTab(store.getState())).to.have.property(
        'type',
        'Collection'
      );
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'foo.bar'
      );

      // Replace collection tab with collections list one
      store.dispatch(openFallbackTab(getActiveTab(store.getState())!, 'foo'));
      expect(store.getState().tabs).to.have.lengthOf(1);
      expect(getActiveTab(store.getState())).to.have.property(
        'type',
        'Collections'
      );
      expect(getActiveTab(store.getState())).to.have.property(
        'namespace',
        'foo'
      );

      // Replace collections list tab with the databases list
      store.dispatch(openFallbackTab(getActiveTab(store.getState())!, null));
      expect(store.getState().tabs).to.have.lengthOf(1);
      expect(getActiveTab(store.getState())).to.have.property(
        'type',
        'Databases'
      );
      expect(getActiveTab(store.getState())).to.not.have.property('namespace');
    });
  });
});

describe('_bulkTabsClose', function () {
  it('Scenario 1: Active tab is not closed', function () {
    const { tabs, activeTabId } = _bulkTabsClose({
      state: {
        tabs: [
          { type: 'Databases', connectionId: 'abc', id: 'abc_dbs' },
          { type: 'Databases', connectionId: 'bcd', id: 'bcd_dbs' },
          { type: 'My Queries', id: 'active' },
        ],
        activeTabId: 'active',
        collectionInfo: {},
      },
      isToBeClosed: (tab: WorkspaceTab) => tab.type === 'Databases',
    });

    expect(tabs).to.deep.equal([{ type: 'My Queries', id: 'active' }]);
    expect(activeTabId).to.equal('active');
  });

  it('Scenario 2: Active tab is closed, the very next becomes active', function () {
    const { tabs, activeTabId } = _bulkTabsClose({
      state: {
        tabs: [
          {
            type: 'Collections',
            connectionId: 'abc',
            id: 'abc_db_collections',
            namespace: 'db',
          },
          { type: 'My Queries', id: 'active' },
          { type: 'Databases', connectionId: 'abc', id: 'next_tab' },
          { type: 'Databases', connectionId: 'bcd', id: 'bcd_dbs' },
        ],
        activeTabId: 'active',
        collectionInfo: {},
      },
      isToBeClosed: (tab: WorkspaceTab) => tab.type === 'My Queries',
    });

    expect(tabs).to.deep.equal([
      {
        type: 'Collections',
        connectionId: 'abc',
        id: 'abc_db_collections',
        namespace: 'db',
      },
      { type: 'Databases', connectionId: 'abc', id: 'next_tab' },
      { type: 'Databases', connectionId: 'bcd', id: 'bcd_dbs' },
    ]);
    expect(activeTabId).to.equal('next_tab');
  });

  it('Scenario 3: Active tab is closed & all the tabs after it are closed', function () {
    const { tabs, activeTabId } = _bulkTabsClose({
      state: {
        tabs: [
          {
            type: 'Collections',
            connectionId: 'abc',
            id: 'abc_db_collections',
            namespace: 'db',
          },
          { type: 'My Queries', id: 'last_remaining' },
          { type: 'Databases', connectionId: 'abc', id: 'active' },
          { type: 'Databases', connectionId: 'bcd', id: 'bcd_dbs' },
        ],
        activeTabId: 'active',
        collectionInfo: {},
      },
      isToBeClosed: (tab: WorkspaceTab) => tab.type === 'Databases',
    });

    expect(tabs).to.deep.equal([
      {
        type: 'Collections',
        connectionId: 'abc',
        id: 'abc_db_collections',
        namespace: 'db',
      },
      { type: 'My Queries', id: 'last_remaining' },
    ]);
    expect(activeTabId).to.equal('last_remaining');
  });

  it('Scenario 4: All the tabs are closed', function () {
    const { tabs, activeTabId } = _bulkTabsClose({
      state: {
        tabs: [
          { type: 'My Queries', id: 'queries' },
          { type: 'Databases', connectionId: 'abc', id: 'abc_dbs' },
          { type: 'Databases', connectionId: 'bcd', id: 'bcd_dbs' },
        ],
        activeTabId: 'active',
        collectionInfo: {},
      },
      isToBeClosed: () => true,
    });

    expect(tabs).to.have.length(0);
    expect(activeTabId).to.equal(null);
  });
});
