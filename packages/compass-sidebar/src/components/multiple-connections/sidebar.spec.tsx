import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import type { RenderWithConnectionsHookResult } from '@mongodb-js/testing-library-compass';
import {
  createPluginTestHelpers,
  screen,
  cleanup,
  waitFor,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import MultipleConnectionSidebar from './sidebar';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import { WorkspacesProvider } from '@mongodb-js/compass-workspaces';
import type { WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import { WorkspacesServiceProvider } from '@mongodb-js/compass-workspaces/provider';
import { TestMongoDBInstanceManager } from '@mongodb-js/compass-app-stores/provider';
import { ConnectionImportExportProvider } from '@mongodb-js/compass-connection-import-export';
import { CompassSidebarPlugin } from '../../index';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import type AppRegistry from '../../../../hadron-app-registry/dist';

const savedFavoriteConnection: ConnectionInfo = {
  id: '12345',
  connectionOptions: {
    connectionString: 'mongodb://localhost:12345/',
  },
  favorite: {
    name: 'localhost',
    color: 'color2',
  },
  savedConnectionType: 'favorite',
};

const savedRecentConnection: ConnectionInfo = {
  id: '54321',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27020/',
  },
};

describe('Multiple Connections Sidebar Component', function () {
  let appRegistry: sinon.SinonSpiedInstance<AppRegistry>;
  let track: sinon.SinonStub;
  let connectionsStoreActions: sinon.SinonSpiedInstance<
    RenderWithConnectionsHookResult['connectionsStore']['actions']
  >;
  let workspace: sinon.SinonSpiedInstance<WorkspacesService>;

  const instancesManager = new TestMongoDBInstanceManager({
    _id: '1',
    status: 'ready',
    genuineMongoDB: {
      dbType: 'local',
      isGenuine: true,
    },
    build: {
      isEnterprise: true,
      version: '7.0.1',
    },
    dataLake: {
      isDataLake: false,
      version: '',
    },
    topologyDescription: {
      servers: [],
      setName: '',
      type: 'LoadBalanced',
    },
    databasesStatus: 'ready',
    databases: [
      {
        _id: 'db_ready',
        name: 'db_ready',
        collectionsStatus: 'ready',
        collections: [
          {
            _id: 'coll_ready',
            name: 'coll_ready',
            type: 'collection',
          },
        ],
      },
    ] as any,
  });

  const { renderWithConnections } = createPluginTestHelpers(
    CompassSidebarPlugin.withMockServices({ instancesManager })
  );

  function doRender(
    activeWorkspace: WorkspaceTab | null = null,
    connections: ConnectionInfo[] = [savedFavoriteConnection]
  ) {
    workspace = sinon.spy({
      openMyQueriesWorkspace: () => undefined,
      openShellWorkspace: () => undefined,
      openPerformanceWorkspace: () => undefined,
    }) as any;
    const result = renderWithConnections(
      <ConnectionImportExportProvider>
        <WorkspacesProvider
          value={[
            { name: 'My Queries', component: () => null },
            { name: 'Performance', component: () => null },
          ]}
        >
          <WorkspacesServiceProvider value={workspace as any}>
            <MultipleConnectionSidebar
              activeWorkspace={activeWorkspace}
            ></MultipleConnectionSidebar>
          </WorkspacesServiceProvider>
        </WorkspacesProvider>
      </ConnectionImportExportProvider>,
      {
        preferences: { enableMultipleConnectionSystem: true },
        connections,
        connectFn() {
          return {
            currentOp() {
              return {};
            },
            top() {
              return {};
            },
            getConnectionOptions() {
              return {};
            },
          } as any;
        },
      }
    );
    track = result.track;
    appRegistry = sinon.spy(result.globalAppRegistry);
    connectionsStoreActions = sinon.spy(result.connectionsStore.actions);
    return result;
  }

  afterEach(function () {
    cleanup();
    sinon.restore();
  });

  describe('top level general navigation', function () {
    beforeEach(function () {
      // These tests expect only one connection on the screen
      doRender(undefined, [savedFavoriteConnection]);
    });

    it('should have settings button and it emits open-compass-settings on click', () => {
      const settingsBtn = screen.getByTitle('Compass Settings');
      expect(settingsBtn).to.be.visible;

      userEvent.click(settingsBtn);

      expect(appRegistry.emit).to.have.been.calledWith('open-compass-settings');
    });

    it('should have "My Queries" navigation item and it should the workspace on click', () => {
      const navItem = screen.getByText('My Queries');
      expect(navItem).to.be.visible;

      userEvent.click(navItem);

      expect(workspace.openMyQueriesWorkspace).to.have.been.called;
    });

    it('should have a connections list with connection related actions', function () {
      const listHeader = screen.getByText('Connections');
      expect(listHeader).to.be.visible;

      const collapseAllConnectionsBtn = screen.getByLabelText(
        'Collapse all connections'
      );
      expect(collapseAllConnectionsBtn).to.be.visible;

      const addNewConnectionsBtn = screen.getByLabelText('Add new connection');
      expect(addNewConnectionsBtn).to.be.visible;
    });

    it('should show connection import export action in connection list header', function () {
      expect(screen.getByLabelText('Show actions')).to.be.visible;

      userEvent.click(screen.getByLabelText('Show actions'));
      expect(screen.getByText('Import connections')).to.be.visible;
      expect(screen.getByText('Export connections')).to.be.visible;
    });
  });

  describe('connections list', function () {
    context('when there are no connections', function () {
      it('should display an empty state with a CTA to add new connection', function () {
        doRender(undefined, []);

        expect(() => screen.getByRole('tree')).to.throw;

        const ctaText = screen.getByText(
          'You have not connected to any deployments.'
        );
        expect(ctaText).to.be.visible;

        const addNewConnectionBtn = screen.getByTestId(
          'add-new-connection-button'
        );
        expect(addNewConnectionBtn).to.be.visible;

        userEvent.click(addNewConnectionBtn);
        // Connect button in the form modal
        expect(screen.getByTestId('connect-button')).to.be.visible;
      });
    });

    context('when there are some connections', function () {
      const renderAndWaitForNavigationTree = async (
        ...[activeTab, connections]: Parameters<typeof doRender>
      ) => {
        const result = doRender(
          activeTab,
          connections ?? [savedFavoriteConnection, savedRecentConnection]
        );
        await waitFor(() => screen.getByRole('tree'));
        return result;
      };

      const connectAndNotifyInstanceManager = async (
        connectionInfo: ConnectionInfo
      ) => {
        await connectionsStoreActions.connect(connectionInfo);
        instancesManager.emit(
          'instance-started',
          connectionInfo.id,
          instancesManager.getMongoDBInstanceForConnection()
        );
      };

      it('should not render the empty CTA and instead render the connections tree', async function () {
        await renderAndWaitForNavigationTree(undefined);
        const connectionNavigationItems = screen.getAllByRole('treeitem');
        expect(connectionNavigationItems).to.have.lengthOf(2);
        expect(connectionNavigationItems[0]).to.have.attribute(
          'data-id',
          savedFavoriteConnection.id
        );
        expect(connectionNavigationItems[1]).to.have.attribute(
          'data-id',
          savedRecentConnection.id
        );
      });

      context('on hover of connection navigation item', function () {
        it('should display actions for favorite item', async function () {
          await renderAndWaitForNavigationTree();
          const favoriteItem = screen.getByTestId(savedFavoriteConnection.id);
          expect(favoriteItem).to.be.visible;

          userEvent.hover(
            within(favoriteItem).getByTestId('base-navigation-item')
          );

          const moreActions =
            within(favoriteItem).getByLabelText('Show actions');
          expect(moreActions).to.be.visible;

          userEvent.click(moreActions);
          const editAction = screen.getByText('Edit connection');
          expect(editAction).to.be.visible;

          const copyAction = screen.getByText('Copy connection string');
          expect(copyAction).to.be.visible;

          // Unfavorite because the connection is already a favorite
          const favAction = screen.getByText('Unfavorite');
          expect(favAction).to.be.visible;

          const duplicateAction = screen.getByText('Duplicate');
          expect(duplicateAction).to.be.visible;

          const removeAction = screen.getByText('Remove');
          expect(removeAction).to.be.visible;
        });

        it('should display actions for non-favorite item', async function () {
          await renderAndWaitForNavigationTree();
          const nonFavoriteItem = screen.getByTestId(savedRecentConnection.id);
          expect(nonFavoriteItem).to.be.visible;

          userEvent.hover(
            within(nonFavoriteItem).getByTestId('base-navigation-item')
          );

          const moreActions =
            within(nonFavoriteItem).getByLabelText('Show actions');
          expect(moreActions).to.be.visible;

          userEvent.click(moreActions);
          const editAction = screen.getByText('Edit connection');
          expect(editAction).to.be.visible;

          const copyAction = screen.getByText('Copy connection string');
          expect(copyAction).to.be.visible;

          // Favorite because the connection is not yet a favorite
          const favAction = screen.getByText('Favorite');
          expect(favAction).to.be.visible;

          const duplicateAction = screen.getByText('Duplicate');
          expect(duplicateAction).to.be.visible;

          const removeAction = screen.getByText('Remove');
          expect(removeAction).to.be.visible;
        });
      });

      context('when connected', function () {
        it('should render the connected connections expanded', async () => {
          await renderAndWaitForNavigationTree({
            id: '123',
            type: 'Databases',
            connectionId: savedFavoriteConnection.id,
          });

          await connectAndNotifyInstanceManager(savedFavoriteConnection);

          const connectedItem = screen.getByTestId(savedFavoriteConnection.id);
          expect(connectedItem).to.exist;

          expect(connectedItem).to.have.attribute('aria-expanded', 'true');
        });

        it('should display actions for connected item', async () => {
          await renderAndWaitForNavigationTree();

          await connectAndNotifyInstanceManager(savedFavoriteConnection);

          const connectedItem = screen.getByTestId(savedFavoriteConnection.id);

          userEvent.hover(
            within(connectedItem).getByTestId('base-navigation-item')
          );

          expect(within(connectedItem).getByLabelText('Open MongoDB shell')).to
            .be.visible;
          expect(within(connectedItem).getByLabelText('Create database')).to.be
            .visible;

          userEvent.click(within(connectedItem).getByLabelText('Show actions'));

          expect(screen.getByText('View performance metrics')).to.be.visible;
          expect(screen.getByText('Show connection info')).to.be.visible;
          expect(screen.getByText('Disconnect')).to.be.visible;

          expect(screen.getByText('Copy connection string')).to.be.visible;
          // because it is already a favorite
          expect(screen.getByText('Unfavorite')).to.be.visible;
          expect(screen.getByText('Duplicate')).to.be.visible;
          expect(screen.getByText('Remove')).to.be.visible;
        });

        it('should render the only connected connections when toggled', async () => {
          await renderAndWaitForNavigationTree();

          const favoriteConnectionId = savedFavoriteConnection.id;
          const recentConnectionId = savedRecentConnection.id;

          expect(screen.queryByTestId(favoriteConnectionId)).to.be.visible;
          expect(screen.queryByTestId(recentConnectionId)).to.be.visible;

          userEvent.click(screen.getByLabelText('Filter connections'));

          userEvent.click(
            screen.getByLabelText('Show only active connections')
          );

          expect(screen.queryByTestId(favoriteConnectionId)).to.be.null;
          expect(screen.queryByTestId(recentConnectionId)).to.be.null;

          await connectAndNotifyInstanceManager(savedFavoriteConnection);
          expect(screen.queryByTestId(favoriteConnectionId)).to.be.visible;
          expect(screen.queryByTestId(recentConnectionId)).to.be.null;

          await connectAndNotifyInstanceManager(savedRecentConnection);
          expect(screen.queryByTestId(favoriteConnectionId)).to.be.visible;
          expect(screen.queryByTestId(recentConnectionId)).to.be.visible;
        });

        context('and performing actions', function () {
          beforeEach(async function () {
            await renderAndWaitForNavigationTree({
              id: '1234',
              type: 'Databases',
              connectionId: savedFavoriteConnection.id,
            });
            await connectAndNotifyInstanceManager(savedFavoriteConnection);
          });

          it('should open create database modal when clicked on create database action', function () {
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(
              within(connectionItem).getByLabelText('Create database')
            );

            expect(appRegistry.emit).to.have.been.calledWith(
              'open-create-database',
              {
                connectionId: savedFavoriteConnection.id,
              }
            );
          });

          it('should open shell workspace when clicked on open shell action', async function () {
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(screen.getByLabelText('Open MongoDB shell'));

            expect(workspace.openShellWorkspace).to.have.been.calledWith(
              savedFavoriteConnection.id,
              { newTab: true }
            );

            await waitFor(() => {
              expect(track).to.have.been.calledWith('Open Shell');
            });
          });

          it('should open performance workspace when clicked on view performance action', function () {
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(
              within(connectionItem).getByLabelText('Show actions')
            );

            userEvent.click(screen.getByText('View performance metrics'));

            expect(workspace.openPerformanceWorkspace).to.have.been.calledWith(
              savedFavoriteConnection.id
            );
          });

          it('should open connection info modal when clicked on show connection info action', function () {
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(
              within(connectionItem).getByLabelText('Show actions')
            );

            userEvent.click(screen.getByText('Show connection info'));

            expect(screen.getByTestId('connection-info-modal')).to.be.visible;
          });

          it('should disconnect when clicked on disconnect action', function () {
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(
              within(connectionItem).getByLabelText('Show actions')
            );

            userEvent.click(screen.getByText('Disconnect'));

            expect(connectionsStoreActions.disconnect).to.have.been.called;
          });

          it('should not connect when the user tries to expand an inactive connection', function () {
            const connectionItem = screen.getByTestId(savedRecentConnection.id);

            userEvent.click(
              within(connectionItem).getByLabelText('Caret Right Icon')
            );
            expect(connectionsStoreActions.connect).to.not.be.calledWith(
              savedRecentConnection
            );
          });

          it('should open edit connection modal when clicked on edit connection action', function () {
            // note that we only click on non-connected item because for
            // connected item we cannot edit connection
            const connectionItem = screen.getByTestId(savedRecentConnection.id);
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(
              within(connectionItem).getByLabelText('Show actions')
            );

            userEvent.click(screen.getByText('Edit connection'));

            expect(screen.getByText('Edit Connection String')).to.be.visible;
          });

          it('should copy connection string onto clipboard when clicked on copy connection string action', async function () {
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(
              within(connectionItem).getByLabelText('Show actions')
            );

            userEvent.click(screen.getByText('Copy connection string'));

            await waitFor(() => {
              expect(screen.getByText('Copied to clipboard.')).to.be.visible;
            });
          });

          it('should unfavorite/favorite connection when clicked on favorite/unfavorite action', async function () {
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(
              within(connectionItem).getByLabelText('Show actions')
            );

            userEvent.click(screen.getByText('Unfavorite'));

            await waitFor(() => {
              expect(
                connectionsStoreActions.toggleFavoritedConnectionStatus
              ).to.have.been.calledWithExactly(savedFavoriteConnection.id);
            });
          });

          it('should open a connection form when clicked on duplicate action', function () {
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(
              within(connectionItem).getByLabelText('Show actions')
            );

            userEvent.click(screen.getByText('Duplicate'));

            // We see the connect button in the form modal
            expect(screen.getByTestId('connect-button')).to.be.visible;

            // Connection string is pre-filled with a duplicate
            expect(screen.getByTestId('connectionString')).to.have.value(
              savedFavoriteConnection.connectionOptions.connectionString
            );
          });

          it('should disconnect and remove the connection when clicked on remove action', async function () {
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(
              within(connectionItem).getByLabelText('Show actions')
            );

            userEvent.click(screen.getByText('Remove'));

            await waitFor(() => {
              expect(
                connectionsStoreActions.removeConnection
              ).to.have.been.calledWithExactly(savedFavoriteConnection.id);
            });

            await waitFor(() => {
              return expect(screen.getAllByRole('treeitem')).to.have.lengthOf(
                1
              );
            });
          });
        });
      });
    });
  });
});
