import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MultipleConnectionSidebar from './sidebar';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { ToastArea } from '@mongodb-js/compass-components';
import {
  InMemoryConnectionStorage,
  ConnectionStorageProvider,
  type ConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import type { DataService } from 'mongodb-data-service';
import {
  ConnectionsManagerProvider,
  ConnectionsManager,
  ConnectionStatus,
} from '@mongodb-js/compass-connections/provider';
import { createSidebarStore } from '../../stores';
import { Provider } from 'react-redux';
import AppRegistry, { createActivateHelpers } from 'hadron-app-registry';
import {
  type PreferencesAccess,
  createSandboxFromDefaultPreferences,
} from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import {
  type WorkspacesService,
  WorkspacesServiceProvider,
} from '@mongodb-js/compass-workspaces/provider';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import { WorkspacesProvider } from '@mongodb-js/compass-workspaces';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import {
  type MongoDBInstancesManager,
  TestMongoDBInstanceManager,
} from '@mongodb-js/compass-app-stores/provider';
import { ConnectionImportExportProvider } from '@mongodb-js/compass-connection-import-export';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';

type PromiseFunction = (
  resolve: (dataService: DataService) => void,
  reject: (error: { message: string }) => void
) => void;

function slowConnection(response: PromiseFunction): Promise<DataService> {
  return new Promise<DataService>((resolve, reject) => {
    setTimeout(() => response(resolve, reject), 20);
  });
}

function andSucceed(): PromiseFunction {
  return (resolve) => resolve({} as DataService);
}

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
  let preferences: PreferencesAccess;

  const globalAppRegistry = new AppRegistry();
  const emitSpy = sinon.spy(globalAppRegistry, 'emit');
  const activeWorkspace = {
    type: 'Databases',
    connectionId: savedFavoriteConnection.id,
  } as WorkspaceTab;
  const workspaceService: WorkspacesService = {
    openCollectionsWorkspace: sinon.stub(),
    openCollectionWorkspace: sinon.stub(),
    openCollectionWorkspaceSubtab: sinon.stub(),
    openDatabasesWorkspace: sinon.stub(),
    openEditViewWorkspace: sinon.stub(),
    openMyQueriesWorkspace: sinon.stub(),
    openPerformanceWorkspace: sinon.stub(),
    openShellWorkspace: sinon.stub(),
    getActiveWorkspace() {
      return activeWorkspace;
    },
  };

  let connectionStorage: ConnectionStorage;
  let connectionsManager: ConnectionsManager;
  let instancesManager: MongoDBInstancesManager;
  let store: ReturnType<typeof createSidebarStore>['store'];
  let deactivate: () => void;
  let connectFn = sinon.stub();

  function doRender(
    activeWorkspace: WorkspaceTab | null = null,
    { wrapper }: Parameters<typeof render>['1'] = {}
  ) {
    return render(
      <ToastArea>
        <PreferencesProvider value={preferences}>
          <WorkspacesServiceProvider value={workspaceService}>
            <WorkspacesProvider
              value={[{ name: 'My Queries', component: () => null }]}
            >
              <ConnectionStorageProvider value={connectionStorage}>
                <ConnectionsManagerProvider value={connectionsManager}>
                  <Provider store={store}>
                    <MultipleConnectionSidebar
                      activeWorkspace={activeWorkspace}
                    />
                  </Provider>
                </ConnectionsManagerProvider>
              </ConnectionStorageProvider>
            </WorkspacesProvider>
          </WorkspacesServiceProvider>
        </PreferencesProvider>
      </ToastArea>,
      { wrapper }
    );
  }

  beforeEach(async function () {
    connectFn = sinon.stub();
    instancesManager = new TestMongoDBInstanceManager();
    connectionsManager = new ConnectionsManager({
      logger: createNoopLogger().log.unbound,
      __TEST_CONNECT_FN: connectFn,
    });
    connectionStorage = new InMemoryConnectionStorage([
      savedFavoriteConnection,
      savedRecentConnection,
    ]);
    preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({
      enableNewMultipleConnectionSystem: true,
    });
    ({ store, deactivate } = createSidebarStore(
      {
        globalAppRegistry,
        instancesManager,
        logger: createNoopLogger(),
        connectionsManager,
      },
      createActivateHelpers()
    ));
  });

  afterEach(function () {
    deactivate();
    cleanup();
    sinon.restore();
  });

  describe('top level general navigation', function () {
    beforeEach(function () {
      doRender();
    });
    it('should have settings button and it emits open-compass-settings on click', () => {
      const settingsBtn = screen.getByTitle('Compass Settings');
      expect(settingsBtn).to.be.visible;

      userEvent.click(settingsBtn);

      expect(emitSpy).to.have.been.calledWith('open-compass-settings');
    });

    it('should have "My Queries" navigation item and it should the workspace on click', () => {
      const navItem = screen.getByText('My Queries');
      expect(navItem).to.be.visible;

      userEvent.click(navItem);

      expect(workspaceService.openMyQueriesWorkspace).to.have.been.called;
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

      // import export connections actions behind Show actions are not visible
      // because there is no provider
      expect(() => screen.getByLabelText('Show actions')).to.throw;
    });

    context(
      'when there is ConnectionImportExportProvider available',
      function () {
        it('should show connection import export action in connection list header', function () {
          cleanup();
          doRender(null, { wrapper: ConnectionImportExportProvider });
          expect(screen.getByLabelText('Show actions')).to.be.visible;

          userEvent.click(screen.getByLabelText('Show actions'));
          expect(screen.getByText('Import connections')).to.be.visible;
          expect(screen.getByText('Export connections')).to.be.visible;
        });
      }
    );
  });

  describe('connections list', function () {
    context('when there are no connections', function () {
      it('should display an empty state with a CTA to add new connection', function () {
        connectionStorage = new InMemoryConnectionStorage([]);
        doRender();

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
      const storedConnections: ConnectionInfo[] = [
        savedFavoriteConnection,
        savedRecentConnection,
      ];
      async function renderWithConnections(
        connections: ConnectionInfo[] = storedConnections,
        activeWorkspaceTabs: WorkspaceTab | null = null
      ) {
        cleanup();
        connectionStorage = new InMemoryConnectionStorage(connections);
        doRender(activeWorkspaceTabs);
        return await waitFor(() => screen.getByRole('tree'));
      }

      it('should not render the empty CTA and instead render the connections tree', async function () {
        const navigationTree = await renderWithConnections();
        expect(navigationTree).to.be.visible;

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
          await renderWithConnections();
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
          await renderWithConnections();
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

      context('when trying to connect', function () {
        it('(successful connection) calls the connection function and renders the progress toast', async function () {
          connectFn.returns(slowConnection(andSucceed()));
          await renderWithConnections();
          const connectionItem = screen.getByTestId('12345');

          userEvent.click(connectionItem);
          expect(screen.getByText('Connecting to localhost')).to.exist;
          expect(connectFn).to.have.been.called;

          await waitFor(() => {
            expect(screen.queryByText('Connecting to localhost')).to.not.exist;
          });
          expect(screen.getByText('Connected to localhost')).to.exist;
        });

        it('should render the non-genuine modal when connected to a non-genuine mongodb connection', async function () {
          connectFn.returns(slowConnection(andSucceed()));
          await renderWithConnections([
            {
              id: 'non-genuine',
              connectionOptions: {
                connectionString:
                  'mongodb://dummy:1234@dummy-name.cosmos.azure.com:443/?ssl=true',
              },
            },
          ]);
          const connectionItem = screen.getByTestId('non-genuine');
          userEvent.click(connectionItem);
          expect(connectFn).to.have.been.called;
          await waitFor(() => {
            expect(screen.queryByText('Non-Genuine MongoDB Detected')).to.be
              .visible;
          });
        });

        it('(failed connection) calls the connection function and renders the error toast', async function () {
          connectFn.callsFake(() => {
            return Promise.reject(new Error('Expected failure'));
          });
          await renderWithConnections();
          const connectionItem = screen.getByTestId('12345');

          userEvent.click(connectionItem);
          expect(screen.getByText('Connecting to localhost')).to.exist;
          expect(connectFn).to.have.been.called;

          await waitFor(() => {
            expect(() => screen.getByText('Expected failure')).to.not.throw;
          });
        });
      });

      context('when connected', function () {
        const connectedInstance: MongoDBInstance = {
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
            type: 'standalone',
          },
          isWritable: true,
          env: '',
          isAtlas: false,
          isLocalAtlas: false,
          databasesStatus: 'ready',
          databases: [
            {
              _id: 'db_ready',
              name: 'db_ready',
              collectionsLength: 1,
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
          refresh: () => Promise.resolve(),
          fetch: () => Promise.resolve(),
          fetchDatabases: () => Promise.resolve(),
          getNamespace: () => Promise.resolve(null),
          on: () => {},
          removeListener: () => {},
        } as any;

        const connectedDataService: DataService = {
          id: 1,
          getConnectionOptions: () => {
            return {
              ...savedFavoriteConnection.connectionOptions,
            };
          },
          currentOp: () => Promise.resolve({} as any),
          top: () => Promise.resolve({} as any),
          disconnect: () => {},
        } as any;

        const instances = new Map<string, MongoDBInstance>();

        beforeEach(function () {
          instances.set(savedFavoriteConnection.id, connectedInstance);
          sinon
            .stub(instancesManager, 'listMongoDBInstances')
            .returns(instances);
          sinon
            .stub(connectionsManager, 'getDataServiceForConnection')
            .returns(connectedDataService);
          sinon.stub(connectionsManager, 'statusOf').callsFake((id) => {
            if (id === savedFavoriteConnection.id) {
              return ConnectionStatus.Connected;
            }
            return ConnectionStatus.Disconnected;
          });
          ({ store, deactivate } = createSidebarStore(
            {
              globalAppRegistry,
              instancesManager,
              logger: createNoopLogger(),
              connectionsManager,
            },
            createActivateHelpers()
          ));
        });

        it('should render the connected connections expanded', async () => {
          await renderWithConnections(storedConnections, {
            type: 'Databases',
            connectionId: savedFavoriteConnection.id,
          } as WorkspaceTab);

          const connectedItem = screen.getByTestId(savedFavoriteConnection.id);
          expect(connectedItem).to.exist;

          expect(connectedItem).to.have.attribute('aria-expanded', 'true');
        });

        it('should display actions for connected item', async () => {
          await renderWithConnections(storedConnections);

          const connectedItem = screen.getByTestId(savedFavoriteConnection.id);
          userEvent.hover(
            within(connectedItem).getByTestId('base-navigation-item')
          );

          expect(screen.getByLabelText('Create database')).to.be.visible;
          expect(screen.getByLabelText('Open MongoDB shell')).to.be.visible;

          userEvent.click(screen.getByLabelText('Show actions'));

          expect(screen.getByText('View performance metrics')).to.be.visible;
          expect(screen.getByText('Show connection info')).to.be.visible;
          expect(screen.getByText('Disconnect')).to.be.visible;

          expect(screen.getByText('Copy connection string')).to.be.visible;
          // because it is already a favorite
          expect(screen.getByText('Unfavorite')).to.be.visible;
          expect(screen.getByText('Duplicate')).to.be.visible;
          expect(screen.getByText('Remove')).to.be.visible;
        });

        context('and performing actions', function () {
          beforeEach(async function () {
            await renderWithConnections(storedConnections, {
              type: 'Databases',
              connectionId: savedFavoriteConnection.id,
            } as WorkspaceTab);
          });

          it('should open create database modal when clicked on create database action', async function () {
            const emitSpy = sinon.stub(globalAppRegistry, 'emit');
            await renderWithConnections(storedConnections, {
              type: 'Databases',
              connectionId: savedFavoriteConnection.id,
            } as WorkspaceTab);
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(
              within(connectionItem).getByLabelText('Create database')
            );

            expect(emitSpy).to.have.been.calledWith('open-create-database', {
              connectionId: savedFavoriteConnection.id,
            });
          });

          it('should open shell workspace when clicked on open shell action', function () {
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(screen.getByLabelText('Open MongoDB shell'));

            expect(workspaceService.openShellWorkspace).to.have.been.calledWith(
              savedFavoriteConnection.id,
              { newTab: true }
            );
          });

          it('should open performance workspace when clicked on view performance action', function () {
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(screen.getByLabelText('Show actions'));

            userEvent.click(screen.getByText('View performance metrics'));

            expect(
              workspaceService.openPerformanceWorkspace
            ).to.have.been.calledWith(savedFavoriteConnection.id);
          });

          it('should open connection info modal when clicked on show connection info action', function () {
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(screen.getByLabelText('Show actions'));

            userEvent.click(screen.getByText('Show connection info'));

            expect(screen.getByTestId('connection-info-modal')).to.be.visible;
          });

          it('should disconnect when clicked on disconnect action', async function () {
            const disconnectSpy = sinon.spy(
              connectionsManager,
              'closeConnection'
            );
            await renderWithConnections();
            const connectionItem = screen.getByTestId(
              savedFavoriteConnection.id
            );
            userEvent.hover(
              within(connectionItem).getByTestId('base-navigation-item')
            );

            userEvent.click(screen.getByLabelText('Show actions'));

            userEvent.click(screen.getByText('Disconnect'));

            expect(disconnectSpy).to.be.calledWith(savedFavoriteConnection.id);
          });

          it('should connect when the user tries to expand an inactive connection', async function () {
            const connectSpy = sinon.spy(connectionsManager, 'connect');
            await renderWithConnections();
            const connectionItem = screen.getByTestId(savedRecentConnection.id);

            userEvent.click(
              within(connectionItem).getByLabelText('Caret Right Icon')
            );

            expect(connectSpy).to.be.calledWith(savedRecentConnection);
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
            const saveSpy = sinon.spy(connectionStorage, 'save');

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
              expect(saveSpy).to.have.been.calledWithExactly({
                connectionInfo: {
                  ...savedFavoriteConnection,
                  savedConnectionType: 'recent',
                },
              });
            });
          });

          it('should open a connection form when clicked on duplicate action', async function () {
            const saveSpy = sinon.spy(connectionStorage, 'save');

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

            // Does not save the duplicate yet
            await waitFor(() => {
              expect(saveSpy).not.to.have.been.called;
            });

            // We see the connect button in the form modal
            expect(screen.getByTestId('connect-button')).to.be.visible;

            // Connection string is pre-filled with a duplicate
            expect(screen.getByTestId('connectionString')).to.have.value(
              savedFavoriteConnection.connectionOptions.connectionString
            );
          });

          it('should disconnect and remove the connection when clicked on remove action', async function () {
            const closeConnectionSpy = sinon.spy(
              connectionsManager,
              'closeConnection'
            );
            const deleteSpy = sinon.spy(connectionStorage, 'delete');

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
              expect(closeConnectionSpy).to.have.been.calledWithExactly(
                savedFavoriteConnection.id
              );
            });

            await waitFor(() => {
              expect(deleteSpy).to.have.been.calledWithExactly({
                ...savedFavoriteConnection,
              });
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
