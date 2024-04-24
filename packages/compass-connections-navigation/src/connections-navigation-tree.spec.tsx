/* eslint-disable @typescript-eslint/no-empty-function */
import React from 'react';
import {
  render,
  screen,
  cleanup,
  within,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import Sinon from 'sinon';
import {
  type Connection,
  ConnectionsNavigationTree,
} from './connections-navigation-tree';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { type WorkspaceTab } from '@mongodb-js/compass-workspaces';

const connections: Connection[] = [
  {
    connectionInfo: {
      id: 'connection_ready',
      connectionOptions: {
        connectionString: 'mongodb://turtle',
      },
      favorite: {
        name: 'turtles',
      },
      savedConnectionType: 'favorite',
    },
    name: 'turtles',
    databasesStatus: 'ready',
    databasesLength: 2,
    databases: [
      {
        _id: 'db_initial',
        name: 'foo',
        collectionsStatus: 'initial',
        collectionsLength: 5,
        collections: [],
      },
      {
        _id: 'db_ready',
        name: 'bar',
        collectionsStatus: 'ready',
        collectionsLength: 3,
        collections: [
          { _id: 'db_ready.meow', name: 'meow', type: 'collection' },
          { _id: 'db_ready.woof', name: 'woof', type: 'timeseries' },
          { _id: 'db_ready.bwok', name: 'bwok', type: 'view' },
        ],
      },
    ],
    isReady: true,
    isDataLake: false,
    isWritable: false,
  },
  {
    connectionInfo: {
      id: 'connection_initial',
      connectionOptions: {
        connectionString: 'mongodb://peaches',
      },
      favorite: {
        name: 'peaches',
      },
      savedConnectionType: 'favorite',
    },
    name: 'peaches',
    databasesStatus: 'initial',
    databasesLength: 2,
    databases: [],
    isReady: true,
    isDataLake: false,
    isWritable: false,
  },
];

const props = {
  connections,
  expanded: { turtles: { bar: true } },
  activeWorkspace: {
    connectionId: 'connection_ready',
    namespace: 'db_ready.meow',
    type: 'Collection',
  } as WorkspaceTab,
  onConnectionExpand: () => {},
  onDatabaseExpand: () => {},
  onNamespaceAction: () => {},
};

describe('ConnectionsNavigationTree', function () {
  async function renderConnectionsNavigationTree(customProps = {}) {
    const preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({
      enableRenameCollectionModal: true,
      enableNewMultipleConnectionSystem: true,
    });
    render(
      <PreferencesProvider value={preferences}>
        <ConnectionsNavigationTree {...props} {...customProps} />
      </PreferencesProvider>
    );
  }

  afterEach(cleanup);

  context('when the rename collection feature flag is enabled', () => {
    let preferences: PreferencesAccess;
    beforeEach(async function () {
      preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableRenameCollectionModal: true,
      });
    });

    it('shows the Rename Collection action', async function () {
      await renderConnectionsNavigationTree({
        expanded: { connection_ready: { db_ready: true } },
      });

      const collection = screen.getByTestId('sidebar-collection-db_ready.meow');
      const showActionsButton = within(collection).getByTitle('Show actions');

      expect(within(collection).getByTitle('Show actions')).to.exist;

      userEvent.click(showActionsButton);

      expect(screen.getByText('Rename collection')).to.exist;
    });

    it('should activate callback with `rename-collection` when corresponding action is clicked', async function () {
      const spy = Sinon.spy();
      await renderConnectionsNavigationTree({
        expanded: { connection_ready: { db_ready: true } },
        onNamespaceAction: spy,
      });

      const collection = screen.getByTestId('sidebar-collection-db_ready.meow');

      userEvent.click(within(collection).getByTitle('Show actions'));
      userEvent.click(screen.getByText('Rename collection'));

      expect(spy).to.be.calledOnceWithExactly(
        'connection_ready',
        'db_ready.meow',
        'rename-collection'
      );
    });
  });

  it('should render connections', async function () {
    await renderConnectionsNavigationTree();

    expect(screen.getByText('turtles')).to.exist;
    expect(screen.getByText('peaches')).to.exist;
  });

  it('when a connection is collapsed, it should not render databases', async function () {
    await renderConnectionsNavigationTree();

    expect(screen.queryByText('foo')).not.to.exist;
    expect(screen.queryByText('bar')).not.to.exist;
  });

  it('when a connection is expanded, it should render databases', async function () {
    await renderConnectionsNavigationTree({
      expanded: { connection_ready: {} },
    });

    expect(screen.getByText('foo')).to.exist;
    expect(screen.getByText('bar')).to.exist;
  });

  it('when a connection is expanded but databases are not ready, it should render database placeholders', async function () {
    await renderConnectionsNavigationTree({
      expanded: { connection_initial: {} },
    });

    expect(screen.getAllByTestId('placeholder')).to.have.lengthOf(2);
  });

  it('when database is expanded, it should render collections', async function () {
    await renderConnectionsNavigationTree({
      expanded: { connection_ready: { db_ready: true } },
    });

    expect(screen.getByText('meow')).to.exist;
    expect(screen.getByText('woof')).to.exist;
    expect(screen.getByText('bwok')).to.exist;
  });

  it('when database is expanded but collections are not ready, it should render collection placeholders', async function () {
    await renderConnectionsNavigationTree({
      expanded: { connection_ready: { db_initial: true } },
    });

    expect(screen.getAllByTestId('placeholder')).to.have.lengthOf(5);
  });

  it('should make current active namespace tabbable', async function () {
    await renderConnectionsNavigationTree({
      expanded: {
        connection_ready: {},
      },
      activeWorkspace: {
        ...props.activeWorkspace,
        namespace: 'db_ready',
        type: 'Collections',
      } as WorkspaceTab,
    });

    userEvent.tab();

    await waitFor(() => {
      // Virtual list will be the one to grab the focus first, but will
      // immediately forward it to the element and mocking raf here breaks
      // virtual list implementatin, waitFor is to accomodate for that
      expect(document.querySelector('[data-id="db_ready"]')).to.eq(
        document.activeElement
      );
      return true;
    });
  });

  describe('when isReadOnly is false or undefined', function () {
    it('should show all database actions on hover', async function () {
      await renderConnectionsNavigationTree({
        expanded: { connection_ready: {} },
      });

      userEvent.hover(screen.getByText('foo'));

      const database = screen.getByTestId('sidebar-database-db_initial');

      expect(within(database).getByTitle('Create collection')).to.exist;
      expect(within(database).getByTitle('Drop database')).to.exist;
    });

    it('should show all database actions for active namespace', async function () {
      await renderConnectionsNavigationTree({
        expanded: {
          connection_ready: {},
        },
        activeWorkspace: {
          ...props.activeWorkspace,
          namespace: 'db_ready',
          type: 'Collections',
        } as WorkspaceTab,
      });

      const database = screen.getByTestId('sidebar-database-db_ready');

      expect(within(database).getByTitle('Create collection')).to.exist;
      expect(within(database).getByTitle('Drop database')).to.exist;
    });

    it('should show all collection actions', async function () {
      await renderConnectionsNavigationTree({
        expanded: {
          connection_ready: { db_ready: true },
        },
      });

      const collection = screen.getByTestId('sidebar-collection-db_ready.meow');
      const showActionsButton = within(collection).getByTitle('Show actions');

      expect(within(collection).getByTitle('Show actions')).to.exist;

      userEvent.click(showActionsButton);

      expect(screen.getByText('Open in new tab')).to.exist;
      expect(() => screen.getByText('Rename collection')).to.throw;
      expect(screen.getByText('Drop collection')).to.exist;
    });

    it('should show all view actions', async function () {
      await renderConnectionsNavigationTree({
        expanded: {
          connection_ready: { db_ready: true },
        },
        activeWorkspace: {
          ...props.activeWorkspace,
          namespace: 'db_ready.bwok',
        } as WorkspaceTab,
      });

      const collection = screen.getByTestId('sidebar-collection-db_ready.bwok');
      const showActionsButton = within(collection).getByTitle('Show actions');

      expect(within(collection).getByTitle('Show actions')).to.exist;

      userEvent.click(showActionsButton);

      expect(screen.getByText('Open in new tab')).to.exist;
      expect(screen.getByText('Drop view')).to.exist;
      expect(screen.getByText('Duplicate view')).to.exist;
      expect(screen.getByText('Modify view')).to.exist;

      // views cannot be renamed
      expect(() => screen.getByText('Rename collection')).to.throw;
    });
  });

  describe('when isReadOnly is true', function () {
    it('should not show database actions', async function () {
      await renderConnectionsNavigationTree({
        expanded: {
          connection_ready: { db_ready: true },
        },
        activeWorkspace: {
          ...props.activeWorkspace,
          namespace: 'db_ready',
          type: 'Collections',
        } as WorkspaceTab,
        isReadOnly: true,
      });

      const database = screen.getByTestId('sidebar-database-db_ready');

      expect(() => within(database).getByTitle('Create collection')).to.throw;
      expect(() => within(database).getByTitle('Drop database')).to.throw;
    });

    it('should show only one collection action', async function () {
      await renderConnectionsNavigationTree({
        expanded: {
          connection_ready: { db_ready: true },
        },
        activeWorkspace: {
          ...props.activeWorkspace,
          namespace: 'db_ready.bwok',
          type: 'Collection',
        } as WorkspaceTab,
        isReadOnly: true,
      });

      const collection = screen.getByTestId('sidebar-collection-db_ready.bwok');

      expect(within(collection).getByTitle('Open in new tab')).to.exist;
    });
  });

  describe('onNamespaceAction', function () {
    let preferences: PreferencesAccess;
    beforeEach(async function () {
      preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableRenameCollectionModal: true,
        enableNewMultipleConnectionSystem: true,
      });
    });

    it('should activate callback with `select-connection` when a connection is clicked', async function () {
      const spy = Sinon.spy();
      await renderConnectionsNavigationTree({
        onConnectionSelect: spy,
      });

      userEvent.click(screen.getByText('turtles'));

      expect(spy).to.be.calledOnceWithExactly('connection_ready');
    });

    it('should activate callback with `select-database` when database is clicked', async function () {
      const spy = Sinon.spy();
      await renderConnectionsNavigationTree({
        expanded: { connection_ready: {} },
        onNamespaceAction: spy,
      });

      userEvent.click(screen.getByText('foo'));

      expect(spy).to.be.calledOnceWithExactly(
        'connection_ready',
        'db_initial',
        'select-database'
      );
    });

    it('should activate callback with `select-collection` when collection is clicked', async function () {
      const spy = Sinon.spy();
      await renderConnectionsNavigationTree({
        expanded: { connection_ready: { db_ready: true } },
        onNamespaceAction: spy,
      });

      userEvent.click(screen.getByText('meow'));

      expect(spy).to.be.calledOnceWithExactly(
        'connection_ready',
        'db_ready.meow',
        'select-collection'
      );
    });

    describe('database actions', function () {
      it('should activate callback with `drop-database` when corresponding action is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: {} },
          onNamespaceAction: spy,
          activeWorkspace: {
            ...props.activeWorkspace,
            namespace: 'db_initial',
            type: 'Collections',
          } as WorkspaceTab,
        });

        userEvent.click(screen.getByTitle('Drop database'));

        expect(spy).to.be.calledOnceWithExactly(
          'connection_ready',
          'db_initial',
          'drop-database'
        );
      });

      it('should activate callback with `create-collection` when corresponding action is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: {} },
          onNamespaceAction: spy,
          activeWorkspace: {
            ...props.activeWorkspace,
            namespace: 'db_initial',
            type: 'Collections',
          } as WorkspaceTab,
        });

        userEvent.click(screen.getByTitle('Create collection'));

        expect(spy).to.be.calledOnceWithExactly(
          'connection_ready',
          'db_initial',
          'create-collection'
        );
      });
    });

    describe('collection actions', function () {
      it('should activate callback with `open-in-new-tab` when corresponding action is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: { db_ready: true } },
          onNamespaceAction: spy,
        });

        const collection = screen.getByTestId(
          'sidebar-collection-db_ready.meow'
        );

        userEvent.click(within(collection).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Open in new tab'));

        expect(spy).to.be.calledOnceWithExactly(
          'connection_ready',
          'db_ready.meow',
          'open-in-new-tab'
        );
      });

      it('should activate callback with `drop-collection` when corresponding action is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: { db_ready: true } },
          onNamespaceAction: spy,
        });

        const collection = screen.getByTestId(
          'sidebar-collection-db_ready.meow'
        );

        userEvent.click(within(collection).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Drop collection'));

        expect(spy).to.be.calledOnceWithExactly(
          'connection_ready',
          'db_ready.meow',
          'drop-collection'
        );
      });
    });

    describe('view actions', function () {
      it('should activate callback with `duplicate-view` when corresponding action is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: { db_ready: true } },
          activeWorkspace: {
            ...props.activeWorkspace,
            namespace: 'db_ready.bwok',
          } as WorkspaceTab,
          onNamespaceAction: spy,
        });

        const view = screen.getByTestId('sidebar-collection-db_ready.bwok');

        userEvent.click(within(view).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Duplicate view'));

        expect(spy).to.be.calledOnceWithExactly(
          'connection_ready',
          'db_ready.bwok',
          'duplicate-view'
        );
      });

      it('should activate callback with `modify-view` when corresponding action is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: { db_ready: true } },
          activeWorkspace: {
            ...props.activeWorkspace,
            namespace: 'db_ready.bwok',
          } as WorkspaceTab,
          onNamespaceAction: spy,
        });

        const view = screen.getByTestId('sidebar-collection-db_ready.bwok');

        userEvent.click(within(view).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Modify view'));

        expect(spy).to.be.calledOnceWithExactly(
          'connection_ready',
          'db_ready.bwok',
          'modify-view'
        );
      });
    });
  });
});
