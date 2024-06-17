import React from 'react';
import { expect } from 'chai';
import { stub, spy, restore } from 'sinon';
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
import {
  type MongoDBInstancesManager,
  TestMongoDBInstanceManager,
} from '@mongodb-js/compass-app-stores/provider';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

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
    connectionString: 'mongodb://localhost:27017',
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
    connectionString: 'mongodb://localhost:27020',
  },
};

describe('Multiple Connections Sidebar Component', function () {
  let preferences: PreferencesAccess;

  const globalAppRegistry = new AppRegistry();
  const emitSpy = spy(globalAppRegistry, 'emit');
  const activeWorkspace = {
    type: 'Databases',
    connectionId: savedFavoriteConnection.id,
  } as WorkspaceTab;
  const workspaceService: WorkspacesService = {
    openCollectionsWorkspace: stub(),
    openCollectionWorkspace: stub(),
    openCollectionWorkspaceSubtab: stub(),
    openDatabasesWorkspace: stub(),
    openEditViewWorkspace: stub(),
    openMyQueriesWorkspace: stub(),
    openPerformanceWorkspace: stub(),
    openShellWorkspace: stub(),
    getActiveWorkspace() {
      return activeWorkspace;
    },
  };

  let connectionStorage: ConnectionStorage;
  let connectionsManager: ConnectionsManager;
  let instancesManager: MongoDBInstancesManager;
  let store: ReturnType<typeof createSidebarStore>['store'];
  let deactivate: () => void;
  let connectFn = stub();

  function doRender() {
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
                    <MultipleConnectionSidebar activeWorkspace={null} />
                  </Provider>
                </ConnectionsManagerProvider>
              </ConnectionStorageProvider>
            </WorkspacesProvider>
          </WorkspacesServiceProvider>
        </PreferencesProvider>
      </ToastArea>
    );
  }

  beforeEach(async function () {
    connectFn = stub();
    instancesManager = new TestMongoDBInstanceManager();
    connectionsManager = new ConnectionsManager({
      logger: { debug: stub() } as any,
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
        logger: createNoopLoggerAndTelemetry(),
        connectionsManager,
      },
      createActivateHelpers()
    ));
  });

  afterEach(function () {
    deactivate();
    cleanup();
    restore();
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
    });
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
      async function renderWithConnections(
        connections: ConnectionInfo[] = [
          savedFavoriteConnection,
          savedRecentConnection,
        ]
      ) {
        connectionStorage = new InMemoryConnectionStorage(connections);
        doRender();
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

          const connectAction = within(favoriteItem).getByLabelText('Connect');
          expect(connectAction).to.be.visible;

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

          const connectAction =
            within(nonFavoriteItem).getByLabelText('Connect');
          expect(connectAction).to.be.visible;

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

          userEvent.hover(
            within(connectionItem).getByTestId('base-navigation-item')
          );

          const connectButton =
            within(connectionItem).getByLabelText('Connect');

          userEvent.click(connectButton);
          expect(screen.getByText('Connecting to localhost')).to.exist;
          expect(connectFn).to.have.been.called;

          await waitFor(() => {
            expect(screen.queryByText('Connecting to localhost')).to.not.exist;
          });
        });

        it('(failed connection) calls the connection function and renders the error toast', async function () {
          connectFn.callsFake(() => {
            return Promise.reject(new Error('Expected failure'));
          });
          await renderWithConnections();
          const connectionItem = screen.getByTestId('12345');

          userEvent.hover(
            within(connectionItem).getByTestId('base-navigation-item')
          );

          const connectButton =
            within(connectionItem).getByLabelText('Connect');

          userEvent.click(connectButton);
          expect(screen.getByText('Connecting to localhost')).to.exist;
          expect(connectFn).to.have.been.called;

          await waitFor(() => {
            expect(() => screen.getByText('Expected failure')).to.not.throw;
          });
        });
      });
    });
  });
});
