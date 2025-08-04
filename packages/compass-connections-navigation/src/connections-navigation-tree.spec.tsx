/* eslint-disable @typescript-eslint/no-empty-function */
import React from 'react';
import {
  renderWithConnections,
  screen,
  cleanup,
  within,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import Sinon from 'sinon';
import { ConnectionsNavigationTree } from './connections-navigation-tree';
import type { ConnectedConnection, Connection } from './tree-data';
import type {
  AllPreferences,
  PreferencesAccess,
} from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { type WorkspaceTab } from '@mongodb-js/compass-workspaces';
import { ConnectionStatus } from '@mongodb-js/compass-connections/provider';

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
        inferredFromPrivileges: false,
      },
      {
        _id: 'db_ready',
        name: 'bar',
        collectionsStatus: 'ready',
        collectionsLength: 3,
        collections: [
          {
            _id: 'db_ready.meow',
            name: 'meow',
            type: 'collection',
            sourceName: '',
            pipeline: [],
            inferredFromPrivileges: false,
          },
          {
            _id: 'db_ready.woof',
            name: 'woof',
            type: 'timeseries',
            sourceName: '',
            pipeline: [],
            inferredFromPrivileges: false,
          },
          {
            _id: 'db_ready.bwok',
            name: 'bwok',
            type: 'view',
            sourceName: '',
            pipeline: [],
            inferredFromPrivileges: false,
          },
        ],
        inferredFromPrivileges: false,
      },
    ],
    isReady: true,
    isDataLake: false,
    isWritable: true,
    isPerformanceTabAvailable: true,
    isPerformanceTabSupported: true,
    isGenuineMongoDB: true,
    connectionStatus: ConnectionStatus.Connected,
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
    isPerformanceTabAvailable: true,
    isPerformanceTabSupported: false,
    isGenuineMongoDB: true,
    connectionStatus: ConnectionStatus.Connected,
  },
  {
    connectionInfo: {
      id: 'connection_disconnected',
      connectionOptions: {
        connectionString: 'mongodb://connection-disconnected',
      },
      savedConnectionType: 'recent',
    },
    name: 'connection_disconnected',
    connectionStatus: ConnectionStatus.Disconnected,
  },
];

const props: React.ComponentProps<typeof ConnectionsNavigationTree> = {
  connections,
  expanded: { turtles: { bar: true } },
  activeWorkspace: {
    connectionId: 'connection_ready',
    namespace: 'db_ready.meow',
    type: 'Collection',
  } as WorkspaceTab,
  onItemExpand: () => {},
  onItemAction: () => {},
};

describe('ConnectionsNavigationTree', function () {
  let preferences: PreferencesAccess;

  async function renderConnectionsNavigationTree(
    customProps: Partial<
      React.ComponentProps<typeof ConnectionsNavigationTree>
    > = {},
    preferencesOverrides: Partial<AllPreferences> = {}
  ) {
    preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({
      enableRenameCollectionModal: true,
      ...preferencesOverrides,
    });
    return renderWithConnections(
      <PreferencesProvider value={preferences}>
        <ConnectionsNavigationTree {...props} {...customProps} />
      </PreferencesProvider>,
      {
        connections: connections.map((x) => x.connectionInfo),
      }
    );
  }

  afterEach(cleanup);

  context('when the rename collection feature flag is enabled', () => {
    it('shows the Rename Collection action', async function () {
      await renderConnectionsNavigationTree({
        expanded: { connection_ready: { db_ready: true } },
      });

      const collection = screen.getByTestId('connection_ready.db_ready.meow');
      const showActionsButton = await waitFor(() =>
        within(collection).getByTitle('Show actions')
      );

      expect(within(collection).getByTitle('Show actions')).to.exist;

      userEvent.click(showActionsButton);

      expect(screen.getByText('Rename collection')).to.exist;
    });

    it('should activate callback with `rename-collection` when corresponding action is clicked', async function () {
      const spy = Sinon.spy();
      await renderConnectionsNavigationTree({
        expanded: { connection_ready: { db_ready: true } },
        onItemAction: spy,
      });

      const collection = screen.getByTestId('connection_ready.db_ready.meow');

      userEvent.click(within(collection).getByTitle('Show actions'));
      userEvent.click(screen.getByText('Rename collection'));

      expect(spy).to.be.calledOnce;
      const [[item, action]] = spy.args;
      expect(item.type).to.equal('collection');
      expect(item.connectionId).to.equal('connection_ready');
      expect(item.namespace).to.equal('db_ready.meow');
      expect(action).to.equal('rename-collection');
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

    expect(screen.getAllByTestId('placeholder')).to.have.lengthOf(5);
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

  describe('connection markers', function () {
    it('should not render non-genuine marker for the connection item when connection genuine', function () {
      expect(() => screen.getAllByLabelText('Non-Genuine MongoDB')).to.throw;
    });

    it('should render non-genuine marker for the connection item when connection is not genuine', async function () {
      const mockedConnections = [
        {
          ...connections[0],
          isGenuineMongoDB: false,
        },
        connections[1],
        connections[2],
      ];
      const itemActionSpy = Sinon.spy();
      await renderConnectionsNavigationTree({
        connections: mockedConnections,
        onItemAction: itemActionSpy,
      });
      expect(screen.getAllByLabelText('Non-Genuine MongoDB')).to.have.lengthOf(
        1
      );

      userEvent.click(screen.getByLabelText('Non-Genuine MongoDB'));
      expect(itemActionSpy).to.be.calledOnce;
      const [[item, event]] = itemActionSpy.args;
      expect(item.connectionInfo.id).to.equal(
        mockedConnections[0].connectionInfo.id
      );
      expect(event).to.equal('open-non-genuine-mongodb-modal');
    });

    it('should render csfle marker for the connection item when csfle is enabled', async function () {
      const mockedConnections = [
        {
          ...connections[0],
          csfleMode: 'enabled',
        },
        connections[1],
        connections[2],
      ];
      const itemActionSpy = Sinon.spy();
      await renderConnectionsNavigationTree({
        connections: mockedConnections,
        onItemAction: itemActionSpy,
      });
      expect(screen.getByLabelText('Lock Icon')).to.be.visible;
      expect(screen.getAllByLabelText('In-Use Encryption')).to.have.lengthOf(1);

      userEvent.click(screen.getByLabelText('In-Use Encryption'));
      expect(itemActionSpy).to.be.calledOnce;
      const [[item, event]] = itemActionSpy.args;
      expect(item.connectionInfo.id).to.equal(
        mockedConnections[0].connectionInfo.id
      );
      expect(event).to.equal('open-csfle-modal');
    });

    it('should render csfle marker for the connection item when csfle is disabled', async function () {
      const mockedConnections = [
        {
          ...connections[0],
          csfleMode: 'disabled',
        },
        connections[1],
        connections[2],
      ];
      await renderConnectionsNavigationTree({ connections: mockedConnections });
      expect(screen.getByLabelText('Unlock Icon')).to.be.visible;
      expect(screen.getAllByLabelText('In-Use Encryption')).to.have.lengthOf(1);
    });

    it('should not render csfle marker for the connection item when csfle is unavailable', async function () {
      const mockedConnections = [
        {
          ...connections[0],
          csfleMode: 'unavailable',
        },
        connections[1],
        connections[2],
      ];
      await renderConnectionsNavigationTree({ connections: mockedConnections });
      expect(() => screen.getAllByLabelText('In-Use Encryption')).to.throw;
    });
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
      expect(
        document.querySelector('[data-id="connection_ready.db_ready"]')
      ).to.eq(document.activeElement);
      return true;
    });
  });

  it('should render the action items for the tabbed navigation item', async function () {
    await renderConnectionsNavigationTree({
      expanded: {},
      activeWorkspace: null,
    });

    // Tab to the first element
    userEvent.tab();
    await waitFor(() => {
      // Virtual list will be the one to grab the focus first, but will
      // immediately forward it to the element and mocking raf here breaks
      // virtual list implementatin, waitFor is to accomodate for that
      expect(document.querySelector('[data-id="connection_ready"]')).to.eq(
        document.activeElement
      );
      return true;
    });
    let tabbedItem = screen.getByTestId('connection_ready');
    expect(within(tabbedItem).getByLabelText('Show actions')).to.be.visible;

    // Go down to the second element
    userEvent.keyboard('{arrowdown}');
    await waitFor(() => {
      expect(document.querySelector('[data-id="connection_initial"]')).to.eq(
        document.activeElement
      );
      return true;
    });

    tabbedItem = screen.getByTestId('connection_initial');
    expect(within(tabbedItem).getByLabelText('Show actions')).to.be.visible;
  });

  describe('when connection is writable', function () {
    it('should show all connection actions', async function () {
      await renderConnectionsNavigationTree();

      userEvent.hover(screen.getByText('turtles'));

      const connection = screen.getByTestId('connection_ready');

      expect(within(connection).getByTitle('Create database')).to.be.visible;
      expect(within(connection).getByTitle('Open MongoDB shell')).to.be.visible;

      const otherActions = within(connection).getByTitle('Show actions');
      expect(otherActions).to.exist;

      userEvent.click(otherActions);

      expect(screen.getByText('View performance metrics')).to.be.visible;
      expect(screen.getByText('Show connection info')).to.be.visible;
      expect(screen.getByText('Copy connection string')).to.be.visible;
      expect(screen.getByText('Unfavorite connection')).to.be.visible;
      expect(screen.getByText('Disconnect')).to.be.visible;
    });

    it('should show all database actions on hover', async function () {
      await renderConnectionsNavigationTree({
        expanded: { connection_ready: {} },
      });

      userEvent.hover(screen.getByText('foo'));

      const database = screen.getByTestId('connection_ready.db_initial');

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

      const database = screen.getByTestId('connection_ready.db_ready');

      expect(within(database).getByTitle('Create collection')).to.exist;
      expect(within(database).getByTitle('Drop database')).to.exist;
    });

    it('should show all collection actions', async function () {
      await renderConnectionsNavigationTree({
        expanded: {
          connection_ready: { db_ready: true },
        },
      });

      const collection = screen.getByTestId('connection_ready.db_ready.meow');
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

      const collection = screen.getByTestId('connection_ready.db_ready.bwok');
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

  [
    {
      name: 'when connection is not writable',
      async renderReadonlyComponent(
        props: Partial<
          React.ComponentProps<typeof ConnectionsNavigationTree>
        > = {}
      ) {
        const readonlyConnections: ConnectedConnection[] = [
          {
            ...(connections[0] as ConnectedConnection),
            isWritable: false,
          },
          {
            ...(connections[1] as ConnectedConnection),
          },
        ];
        await renderConnectionsNavigationTree({
          ...props,
          connections: readonlyConnections,
        });
      },
    },
    {
      name: 'when connection is datalake',
      async renderReadonlyComponent(
        props: Partial<
          React.ComponentProps<typeof ConnectionsNavigationTree>
        > = {}
      ) {
        const readonlyConnections: ConnectedConnection[] = [
          {
            ...(connections[0] as ConnectedConnection),
            isDataLake: true,
          },
          {
            ...(connections[1] as ConnectedConnection),
          },
        ];
        await renderConnectionsNavigationTree({
          ...props,
          connections: readonlyConnections,
        });
      },
    },
    {
      name: 'when preferences is readonly',
      async renderReadonlyComponent(
        props: Partial<
          React.ComponentProps<typeof ConnectionsNavigationTree>
        > = {}
      ) {
        const readonlyConnections: ConnectedConnection[] = [
          connections[0] as ConnectedConnection,
          connections[1] as ConnectedConnection,
        ];
        await renderConnectionsNavigationTree(
          {
            ...props,
            connections: readonlyConnections,
          },
          {
            readOnly: true,
          }
        );
      },
    },
  ].forEach(function ({ name, renderReadonlyComponent }) {
    describe(name, function () {
      it('should show reduced connection actions', async function () {
        await renderReadonlyComponent();

        userEvent.hover(screen.getByText('turtles'));

        const connection = screen.getByTestId('connection_ready');

        expect(within(connection).queryByTitle('Create database')).not.to.exist;
        if (name !== 'when preferences is readonly') {
          expect(within(connection).getByLabelText('Open MongoDB shell')).to.be
            .visible;
        } else {
          expect(within(connection).queryByLabelText('Open MongoDB shell')).not
            .to.exist;
        }

        const otherActions = within(connection).getByTitle('Show actions');
        expect(otherActions).to.exist;

        userEvent.click(otherActions);

        expect(screen.getByText('View performance metrics')).to.be.visible;
        expect(screen.getByText('Show connection info')).to.be.visible;
        expect(screen.getByText('Copy connection string')).to.be.visible;
        expect(screen.getByText('Unfavorite connection')).to.be.visible;
        expect(screen.getByText('Disconnect')).to.be.visible;
      });

      it('should not show database actions', async function () {
        await renderReadonlyComponent({
          expanded: {
            connection_ready: { db_ready: true },
          },
          activeWorkspace: {
            ...props.activeWorkspace,
            namespace: 'db_ready',
            type: 'Collections',
          } as WorkspaceTab,
        });

        const database = screen.getByTestId('connection_ready.db_ready');

        expect(() => within(database).getByTitle('Create collection')).to.throw;
        expect(() => within(database).getByTitle('Drop database')).to.throw;
      });

      it('should show only one collection action', async function () {
        await renderReadonlyComponent({
          expanded: {
            connection_ready: { db_ready: true },
          },
          activeWorkspace: {
            ...props.activeWorkspace,
            namespace: 'db_ready.bwok',
            type: 'Collection',
          } as WorkspaceTab,
        });

        const collection = screen.getByTestId('connection_ready.db_ready.bwok');

        expect(within(collection).getByTitle('Open in new tab')).to.exist;
      });
    });
  });

  describe('shell action', function () {
    it('should show shell action in the sidebar on hover of connected item', async function () {
      await renderConnectionsNavigationTree();
      userEvent.hover(screen.getByText('turtles'));
      expect(screen.getByLabelText('Open MongoDB shell')).to.be.visible;
    });

    context('when preferences is readonly', function () {
      it('should not render shell action at all', async function () {
        await renderConnectionsNavigationTree(
          {},
          {
            readOnly: true,
          }
        );
        userEvent.hover(screen.getByText('turtles'));
        expect(() => screen.getByLabelText('Open MongoDB shell')).to.throw;
      });
    });

    context('when shell is disabled', function () {
      it('should not render shell action at all', async function () {
        await renderConnectionsNavigationTree(
          {},
          {
            enableShell: false,
          }
        );
        userEvent.hover(screen.getByText('turtles'));
        expect(() => screen.getByLabelText('Open MongoDB shell')).to.throw;
      });
    });
  });

  describe('onItemAction', function () {
    let preferences: PreferencesAccess;
    beforeEach(async function () {
      preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableRenameCollectionModal: true,
      });
    });

    describe('when selecting a tree item', function () {
      it('should activate callback with `select-connection` when a connection is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          onItemAction: spy,
        });

        userEvent.click(screen.getByText('turtles'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('connection');
        expect(item.connectionInfo.id).to.equal('connection_ready');
        expect(action).to.equal('select-connection');
      });

      it('should activate callback with `select-database` when database is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: {} },
          onItemAction: spy,
        });

        userEvent.click(screen.getByText('foo'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('database');
        expect(item.connectionId).to.equal('connection_ready');
        expect(item.dbName).to.equal('db_initial');
        expect(action).to.equal('select-database');
      });

      it('should activate callback with `select-collection` when collection is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: { db_ready: true } },
          onItemAction: spy,
        });

        userEvent.click(screen.getByText('meow'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('collection');
        expect(item.connectionId).to.equal('connection_ready');
        expect(item.namespace).to.equal('db_ready.meow');
        expect(action).to.equal('select-collection');
      });
    });

    describe('connection actions', function () {
      it('should activate callback with `create-database` when add database is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: { db_ready: true } },
          onItemAction: spy,
        });

        userEvent.hover(screen.getByText('turtles'));

        userEvent.click(screen.getByLabelText('Create database'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('connection');
        expect(item.connectionInfo.id).to.equal('connection_ready');
        expect(action).to.equal('create-database');
      });

      context('when performance tab is supported', function () {
        it('should show performance action for connection item and activate callback with `connection-performance-metrics` when clicked', async function () {
          const spy = Sinon.spy();
          await renderConnectionsNavigationTree({
            onItemAction: spy,
          });
          userEvent.hover(screen.getByText('turtles'));
          const connection = screen.getByTestId('connection_ready');
          userEvent.click(within(connection).getByTitle('Show actions'));
          userEvent.click(screen.getByText('View performance metrics'));

          expect(spy).to.be.calledOnce;
          const [[item, action]] = spy.args;
          expect(item.type).to.equal('connection');
          expect(item.connectionInfo.id).to.equal('connection_ready');
          expect(action).to.equal('connection-performance-metrics');
        });
      });

      context('when performance tab is not supported', function () {
        it('should show a disabled `show performance action` for connection item', async function () {
          const spy = Sinon.spy();
          await renderConnectionsNavigationTree({
            onItemAction: spy,
            connections: [
              {
                ...(connections[0] as ConnectedConnection),
                isPerformanceTabSupported: false,
              },
              { ...connections[1] },
            ],
          });
          userEvent.hover(screen.getByText('turtles'));
          const connection = screen.getByTestId('connection_ready');
          userEvent.click(within(connection).getByTitle('Show actions'));

          const menuItem = screen.getByText('View performance metrics');
          expect(menuItem.closest('button')).to.have.attribute(
            'aria-disabled',
            'true'
          );

          userEvent.click(menuItem);
          expect(spy).to.not.be.called;
        });
      });

      context('when connection is not ready', function () {
        it('should not show `show performance action` at all', async function () {
          await renderConnectionsNavigationTree();
          // peaches connection is not ready
          userEvent.hover(screen.getByText('peaches'));
          const connection = screen.getByTestId('connection_initial');
          userEvent.click(within(connection).getByTitle('Show actions'));
          expect(() => screen.getByText('View performance metrics')).to.throw;
        });
      });
    });

    describe('database actions', function () {
      it('should activate callback with `drop-database` when corresponding action is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: {} },
          onItemAction: spy,
          activeWorkspace: {
            ...props.activeWorkspace,
            namespace: 'db_initial',
            type: 'Collections',
          } as WorkspaceTab,
        });

        userEvent.click(screen.getByTitle('Drop database'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('database');
        expect(item.connectionId).to.equal('connection_ready');
        expect(item.dbName).to.equal('db_initial');
        expect(action).to.equal('drop-database');
      });

      it('should activate callback with `create-collection` when corresponding action is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: {} },
          onItemAction: spy,
          activeWorkspace: {
            ...props.activeWorkspace,
            namespace: 'db_initial',
            type: 'Collections',
          } as WorkspaceTab,
        });

        userEvent.click(screen.getByTitle('Create collection'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('database');
        expect(item.connectionId).to.equal('connection_ready');
        expect(item.dbName).to.equal('db_initial');
        expect(action).to.equal('create-collection');
      });
    });

    describe('collection actions', function () {
      it('should activate callback with `open-in-new-tab` when corresponding action is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: { db_ready: true } },
          onItemAction: spy,
        });

        const collection = screen.getByTestId('connection_ready.db_ready.meow');

        userEvent.click(within(collection).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Open in new tab'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('collection');
        expect(item.connectionId).to.equal('connection_ready');
        expect(item.namespace).to.equal('db_ready.meow');
        expect(action).to.equal('open-in-new-tab');
      });

      it('should activate callback with `drop-collection` when corresponding action is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: { db_ready: true } },
          onItemAction: spy,
        });

        const collection = screen.getByTestId('connection_ready.db_ready.meow');

        userEvent.click(within(collection).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Drop collection'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('collection');
        expect(item.connectionId).to.equal('connection_ready');
        expect(item.namespace).to.equal('db_ready.meow');
        expect(action).to.equal('drop-collection');
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
          onItemAction: spy,
        });

        const view = screen.getByTestId('connection_ready.db_ready.bwok');

        userEvent.click(within(view).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Duplicate view'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('view');
        expect(item.connectionId).to.equal('connection_ready');
        expect(item.namespace).to.equal('db_ready.bwok');
        expect(action).to.equal('duplicate-view');
      });

      it('should activate callback with `modify-view` when corresponding action is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: { db_ready: true } },
          activeWorkspace: {
            ...props.activeWorkspace,
            namespace: 'db_ready.bwok',
          } as WorkspaceTab,
          onItemAction: spy,
        });

        const view = screen.getByTestId('connection_ready.db_ready.bwok');

        userEvent.click(within(view).getByTitle('Show actions'));
        userEvent.click(screen.getByText('Modify view'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('view');
        expect(item.connectionId).to.equal('connection_ready');
        expect(item.namespace).to.equal('db_ready.bwok');
        expect(action).to.equal('modify-view');
      });
    });
  });

  describe('context menu', function () {
    const assertContextMenuItems = async (
      element: HTMLElement,
      items: (string | { separator: true })[]
    ) => {
      userEvent.click(element, { button: 2 });
      await waitFor(() => {
        expect(screen.getByTestId('context-menu')).to.be.visible;
      });
      let groupIndex = 0;
      let itemIndex = 0;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (typeof item === 'object' && 'separator' in item) {
          groupIndex++;
          itemIndex = 0;
          continue;
        }
        if (typeof item === 'string') {
          expect(
            screen.getByTestId(`menu-group-${groupIndex}-item-${itemIndex}`)
          ).to.have.text(item);
        }
        itemIndex++;
      }
      // Expect no more items
      expect(
        screen.queryByTestId(`menu-group-${groupIndex}-item-${itemIndex + 1}`)
      ).to.not.exist;
      expect(screen.queryByTestId(`menu-group-${groupIndex + 1}-item-0`)).to.not
        .exist;
    };

    describe('connection context menu', function () {
      it('should show context menu for connected connection', async function () {
        await renderConnectionsNavigationTree();

        const connectionElement = within(
          screen.getByTestId('connection_ready')
        ).getByTestId('base-navigation-item');

        await assertContextMenuItems(connectionElement, [
          'Edit connection',
          'Copy connection string',
          'Unfavorite connection',
          'Duplicate connection',
          'Remove connection',
          { separator: true },
          'Open MongoDB shell',
          'View performance metrics',
          'Show connection info',
          'Refresh databases',
          { separator: true },
          'Disconnect',
        ]);
      });

      it('should show context menu for disconnected connection', async function () {
        await renderConnectionsNavigationTree();

        const connectionElement = within(
          screen.getByTestId('connection_disconnected')
        ).getByTestId('base-navigation-item');
        userEvent.click(connectionElement, { button: 2 });

        await waitFor(() => {
          expect(screen.getByTestId('context-menu')).to.be.visible;
        });

        // Check for expected context menu items for disconnected connection
        await assertContextMenuItems(connectionElement, [
          'Connect',
          'Edit connection',
          'Copy connection string',
          'Favorite connection',
          'Duplicate connection',
          'Remove connection',
        ]);
      });
    });

    describe('database context menu', function () {
      it('should show context menu for database', async function () {
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: {} },
        });

        const databaseElement = within(
          screen.getByTestId('connection_ready.db_initial')
        ).getByTestId('base-navigation-item');

        // Check for expected context menu items for database
        await assertContextMenuItems(databaseElement, [
          'Create collection',
          { separator: true },
          'Create database',
          'Drop database',
          { separator: true },
          'Open MongoDB shell',
          'View performance metrics',
          'Show connection info',
          'Refresh databases',
          { separator: true },
          'Disconnect',
        ]);
      });

      it('should show limited context menu for database when read-only', async function () {
        await renderConnectionsNavigationTree(
          {
            expanded: { connection_ready: {} },
          },
          {
            readOnly: true,
          }
        );

        const databaseElement = within(
          screen.getByTestId('connection_ready.db_initial')
        ).getByTestId('base-navigation-item');
        userEvent.click(databaseElement, { button: 2 });

        const contextMenu = screen.getByTestId('context-menu');

        // Check that write actions are not present in read-only mode
        expect(() => within(contextMenu).getByText('Create collection')).to
          .throw;
        expect(() => within(contextMenu).getByText('Create database')).to.throw;
        expect(() => within(contextMenu).getByText('Drop database')).to.throw;

        // Check that read-only actions are still present
        expect(within(contextMenu).getByText('View performance metrics')).to.be
          .visible;
        expect(within(contextMenu).getByText('Show connection info')).to.be
          .visible;
        expect(within(contextMenu).getByText('Refresh databases')).to.be
          .visible;
        expect(within(contextMenu).getByText('Disconnect')).to.be.visible;
      });
    });

    describe('collection context menu', function () {
      it('should show context menu for collection', async function () {
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: { db_ready: true } },
        });

        const collectionElement = within(
          screen.getByTestId('connection_ready.db_ready.meow')
        ).getByTestId('base-navigation-item');
        userEvent.click(collectionElement, { button: 2 });

        await waitFor(() => {
          expect(screen.getByTestId('context-menu')).to.be.visible;
        });

        // Check for expected context menu items for collection
        await assertContextMenuItems(collectionElement, [
          'Open in new tab',
          { separator: true },
          'Rename collection',
          'Create collection',
          'Drop collection',
          { separator: true },
          'Open MongoDB shell',
          'View performance metrics',
          'Show connection info',
          'Refresh databases',
          { separator: true },
          'Disconnect',
        ]);
      });

      it('should show limited context menu for collection when read-only', async function () {
        await renderConnectionsNavigationTree(
          {
            expanded: { connection_ready: { db_ready: true } },
          },
          {
            readOnly: true,
          }
        );

        const collectionElement = within(
          screen.getByTestId('connection_ready.db_ready.meow')
        ).getByTestId('base-navigation-item');
        userEvent.click(collectionElement, { button: 2 });

        await waitFor(() => {
          expect(screen.getByTestId('context-menu')).to.be.visible;
        });

        await assertContextMenuItems(collectionElement, [
          'Open in new tab',
          { separator: true },
          'View performance metrics',
          'Show connection info',
          'Refresh databases',
          { separator: true },
          'Disconnect',
        ]);
      });
    });

    describe('view context menu', function () {
      it('should show context menu for view', async function () {
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: { db_ready: true } },
        });

        const viewElement = within(
          screen.getByTestId('connection_ready.db_ready.bwok')
        ).getByTestId('base-navigation-item');

        // Check for expected context menu items for view
        await assertContextMenuItems(viewElement, [
          'Open in new tab',
          { separator: true },
          'Duplicate view',
          'Modify view',
          'Drop view',
          { separator: true },
          'Open MongoDB shell',
          'View performance metrics',
          'Show connection info',
          'Refresh databases',
          { separator: true },
          'Disconnect',
        ]);

        // Views should not have rename option
        expect(() => screen.getByText('Rename collection')).to.throw;
      });

      it('should show limited context menu for view when read-only', async function () {
        await renderConnectionsNavigationTree(
          {
            expanded: { connection_ready: { db_ready: true } },
          },
          {
            readOnly: true,
          }
        );

        const viewElement = within(
          screen.getByTestId('connection_ready.db_ready.bwok')
        ).getByTestId('base-navigation-item');

        // Check that read-only actions are still present
        await assertContextMenuItems(viewElement, [
          'Open in new tab',
          { separator: true },
          'View performance metrics',
          'Show connection info',
          'Refresh databases',
          { separator: true },
          'Disconnect',
        ]);
      });
    });

    describe('context menu actions', function () {
      it('should trigger onItemAction when context menu item is clicked', async function () {
        const spy = Sinon.spy();
        await renderConnectionsNavigationTree({
          expanded: { connection_ready: { db_ready: true } },
          onItemAction: spy,
        });

        const collectionElement = within(
          screen.getByTestId('connection_ready.db_ready.meow')
        ).getByTestId('base-navigation-item');
        userEvent.click(collectionElement, { button: 2 });

        await waitFor(() => {
          expect(screen.getByTestId('context-menu')).to.be.visible;
        });

        userEvent.click(screen.getByText('Open in new tab'));

        expect(spy).to.be.calledOnce;
        const [[item, action]] = spy.args;
        expect(item.type).to.equal('collection');
        expect(item.namespace).to.equal('db_ready.meow');
        expect(action).to.equal('open-in-new-tab');
      });
    });
  });
});
