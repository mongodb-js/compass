import React from 'react';
import { expect } from 'chai';
import { render, screen, waitFor } from '@testing-library/react';
import ActiveConnectionNavigation from './active-connection-navigation';
import {
  ConnectionsManager,
  ConnectionsManagerProvider,
  type DataService,
  type ConnectionInfo,
} from '@mongodb-js/compass-connections/provider';
import { createSidebarStore } from '../../../stores';
import { Provider } from 'react-redux';
import AppRegistry from 'hadron-app-registry';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import userEvent from '@testing-library/user-event';
import sinon from 'sinon';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import {
  type PreferencesAccess,
  PreferencesProvider,
} from 'compass-preferences-model/provider';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import { EventEmitter } from 'events';
import {
  type WorkspacesService,
  WorkspacesServiceProvider,
} from '@mongodb-js/compass-workspaces/provider';

class MockInstance extends EventEmitter {
  _id: string;
  status: string;
  databasesStatus: string;
  databases: {
    _id: string;
    name: string;
    status: string;
    collectionsLength: number;
    collectionsStatus: string;
    collections: any[];
  }[];
  build: Record<string, never>;
  dataLake: Record<string, never>;
  genuineMongoDB: Record<string, never>;
  topologyDescription: Record<string, never>;

  constructor() {
    super();
    this._id = 'turtle';
    this.status = 'ready';
    this.databasesStatus = 'ready';
    this.databases = [
      {
        _id: 'turtleDB1',
        name: 'turtleDB1',
        status: 'ready',
        collectionsLength: 1,
        collectionsStatus: 'ready',
        collections: [
          {
            _id: 'turtleDB1Coll1',
            name: 'turtleDB1Coll1',
            type: 'collection',
          },
        ],
      },
    ];
    this.build = {};
    this.dataLake = {};
    this.genuineMongoDB = {};
    this.topologyDescription = {};
  }
}

const mockConnections: ConnectionInfo[] = [
  {
    id: 'turtle',
    connectionOptions: {
      connectionString: 'mongodb://turtle',
    },
    savedConnectionType: 'recent',
  },
  {
    id: 'oranges',
    connectionOptions: {
      connectionString: 'mongodb://peaches',
    },
    favorite: {
      name: 'peaches',
    },
    savedConnectionType: 'favorite',
  },
];

describe('<ActiveConnectionNavigation />', function () {
  let connectionsManager: ConnectionsManager;
  let preferences: PreferencesAccess;
  let store: ReturnType<typeof createSidebarStore>['store'];
  let turtleInstance: EventEmitter;
  let dataService: DataService;
  let dataServiceCurrentOp = sinon.stub().resolves();
  let deactivate: () => void;
  const globalAppRegistry = new AppRegistry();
  const onOpenConnectionInfoStub = sinon.stub();
  const onCopyConnectionStringStub = sinon.stub();
  const onToggleFavoriteConnectionStub = sinon.stub();
  const openPerformanceWorkspaceStub = sinon.stub();

  const renderActiveConnectionsNavigation = async ({
    activeWorkspace = {
      type: 'Databases',
      connectionId: 'turtle',
      id: '12345',
    },
  }: {
    activeWorkspace?: WorkspaceTab;
  } = {}) => {
    const dataServiceEmitter = new EventEmitter();
    dataService = {
      currentOp: dataServiceCurrentOp,
      top: () => Promise.resolve(),
      id: 'mockDataService',
      disconnect() {},
      addReauthenticationHandler() {},
      getUpdatedSecrets() {
        return Promise.resolve('mockDataService');
      },
      getConnectionOptions: () => ({
        connectionString: 'mongodb://localhost',
      }),
      emit: dataServiceEmitter.emit.bind(dataServiceEmitter),
      on: dataServiceEmitter.on.bind(dataServiceEmitter),
    } as unknown as DataService;
    turtleInstance = new MockInstance();
    connectionsManager = new ConnectionsManager({} as any);
    (connectionsManager as any).getDataServiceForConnection = () => dataService;
    (connectionsManager as any).connectionStatuses.set('turtle', 'connected');
    (connectionsManager as any).connectionStatuses.set('oranges', 'connected');
    ({ store, deactivate } = createSidebarStore(
      {
        globalAppRegistry,
        instancesManager: {
          listMongoDBInstances() {
            return new Map([['turtle', turtleInstance]]);
          },
        } as any,
        connectionsManager,
        logger: createNoopLoggerAndTelemetry(),
      },
      { on() {}, cleanup() {}, addCleanup() {} } as any
    ));

    preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences({
      enableRenameCollectionModal: true,
      enableNewMultipleConnectionSystem: true,
    });

    return render(
      <PreferencesProvider value={preferences}>
        <WorkspacesServiceProvider
          value={
            {
              openPerformanceWorkspace: openPerformanceWorkspaceStub,
            } as unknown as WorkspacesService
          }
        >
          <ConnectionsManagerProvider value={connectionsManager}>
            <Provider store={store}>
              <ActiveConnectionNavigation
                activeConnections={mockConnections}
                activeWorkspace={activeWorkspace}
                onOpenConnectionInfo={onOpenConnectionInfoStub}
                onCopyConnectionString={onCopyConnectionStringStub}
                onToggleFavoriteConnection={onToggleFavoriteConnectionStub}
              />
            </Provider>
          </ConnectionsManagerProvider>
        </WorkspacesServiceProvider>
      </PreferencesProvider>
    );
  };

  afterEach(() => {
    deactivate();
    sinon.resetHistory();
  });

  it('Should render the number of connections', async function () {
    await renderActiveConnectionsNavigation();
    await waitFor(() => {
      expect(screen.queryByText('(2)')).to.be.visible;
    });
  });

  describe('Connection actions', () => {
    beforeEach(async () => {
      await renderActiveConnectionsNavigation();
    });

    it('Calls onOpenConnectionInfo', async () => {
      userEvent.hover(screen.getByText('turtle'));

      const connectionActionsBtn = screen.getByTitle('Show actions');
      expect(connectionActionsBtn).to.be.visible;

      userEvent.click(connectionActionsBtn);

      const openConnectionInfoBtn = await screen.findByText(
        'Show connection info'
      );
      expect(openConnectionInfoBtn).to.be.visible;

      userEvent.click(openConnectionInfoBtn);

      expect(onOpenConnectionInfoStub).to.have.been.calledWith('turtle');
    });

    it('Calls onCopyConnectionString', async () => {
      userEvent.hover(screen.getByText('turtle'));

      const connectionActionsBtn = screen.getByTitle('Show actions');
      expect(connectionActionsBtn).to.be.visible;

      userEvent.click(connectionActionsBtn);

      const copyConnectionStringBtn = await screen.findByText(
        'Copy connection string'
      );
      expect(copyConnectionStringBtn).to.be.visible;

      userEvent.click(copyConnectionStringBtn);

      expect(onCopyConnectionStringStub).to.have.been.calledWith('turtle');
    });

    it('Calls onToggleFavoriteConnection', async () => {
      userEvent.hover(screen.getByText('turtle'));

      const connectionActionsBtn = screen.getByTitle('Show actions');
      expect(connectionActionsBtn).to.be.visible;

      userEvent.click(connectionActionsBtn);

      const favoriteBtn = await screen.findByText('Favorite');
      expect(favoriteBtn).to.be.visible;

      userEvent.click(favoriteBtn);

      expect(onToggleFavoriteConnectionStub).to.have.been.calledWith('turtle');
    });

    it('Calls openPerformanceWorkspace', async () => {
      userEvent.hover(screen.getByText('turtle'));

      const connectionActionsBtn = screen.getByTitle('Show actions');
      expect(connectionActionsBtn).to.be.visible;

      userEvent.click(connectionActionsBtn);

      const metricsBtn = await screen.findByText('View performance metrics');
      expect(metricsBtn).to.be.visible;

      userEvent.click(metricsBtn);

      expect(openPerformanceWorkspaceStub).to.have.been.calledWith('turtle');
    });
  });

  describe('Connection actions - when Performance is not available', () => {
    beforeEach(async () => {
      dataServiceCurrentOp = sinon.stub().rejects({ codeName: 'AtlasError' });
      await renderActiveConnectionsNavigation();
    });

    it('Performance action is disabled', async () => {
      userEvent.hover(screen.getByText('turtle'));

      const connectionActionsBtn = screen.getByTitle('Show actions');
      expect(connectionActionsBtn).to.be.visible;

      userEvent.click(connectionActionsBtn);

      const metricsBtn = (
        await screen.findByText('View performance metrics')
      ).closest('button');
      expect(metricsBtn).not.to.be.null;
      expect(metricsBtn).to.be.visible;
      expect(metricsBtn).to.have.attribute('disabled');
    });
  });

  describe('Collapse and Auto-expand', () => {
    it('should collapse a connection, and expand it automatically when a child workspace is entered', async function () {
      // step 1 - turtle connection is expanded at first
      const { rerender } = await renderActiveConnectionsNavigation({
        activeWorkspace: { type: 'My Queries', id: 'abcd' },
      });

      turtleInstance.emit('change:databasesStatus');

      expect(screen.getByText('turtleDB1')).to.be.visible;

      // step 2 - user collapses the turtle connection
      const connectionItem = screen.getByText('turtle');

      userEvent.click(connectionItem);
      userEvent.keyboard('[ArrowLeft]');

      expect(screen.queryByText('turtleDB1')).not.to.exist;

      // step 3 - user entered a workspace that belongs to the turtle connection
      rerender(
        <PreferencesProvider value={preferences}>
          <ConnectionsManagerProvider value={connectionsManager}>
            <Provider store={store}>
              <ActiveConnectionNavigation
                activeConnections={mockConnections}
                activeWorkspace={
                  {
                    type: 'Collections',
                    connectionId: 'turtle',
                    namespace: 'db1',
                  } as WorkspaceTab
                }
                onOpenConnectionInfo={onOpenConnectionInfoStub}
                onCopyConnectionString={onCopyConnectionStringStub}
                onToggleFavoriteConnection={onToggleFavoriteConnectionStub}
              />
            </Provider>
          </ConnectionsManagerProvider>
        </PreferencesProvider>
      );

      expect(screen.getByText('turtleDB1')).to.be.visible;
    });

    it('should expand a database when a child workspace is entered', async function () {
      // step 1 - turtleDB1 is collapsed at first
      const { rerender } = await renderActiveConnectionsNavigation({
        activeWorkspace: { type: 'My Queries', id: 'abcd' },
      });

      turtleInstance.emit('change:databasesStatus');

      expect(screen.queryByText('turtleDB1Coll1')).not.to.exist;

      // step 2 - user entered a workspace that belongs to the turtleDB1 database
      rerender(
        <PreferencesProvider value={preferences}>
          <ConnectionsManagerProvider value={connectionsManager}>
            <Provider store={store}>
              <ActiveConnectionNavigation
                activeConnections={mockConnections}
                activeWorkspace={
                  {
                    type: 'Collection',
                    connectionId: 'turtle',
                    namespace: 'turtleDB1.turtleDB1Coll1',
                  } as WorkspaceTab
                }
                onOpenConnectionInfo={onOpenConnectionInfoStub}
                onCopyConnectionString={onCopyConnectionStringStub}
                onToggleFavoriteConnection={onToggleFavoriteConnectionStub}
              />
            </Provider>
          </ConnectionsManagerProvider>
        </PreferencesProvider>
      );

      expect(screen.getByText('turtleDB1Coll1')).to.be.visible;
    });

    it('should collapse and expand database', async function () {
      // step 1 - turtleDB1 is collapsed at first
      await renderActiveConnectionsNavigation({
        activeWorkspace: { type: 'My Queries', id: 'abcd' },
      });

      turtleInstance.emit('change:databasesStatus');

      expect(screen.queryByText('turtleDB1Coll1')).not.to.exist;

      // step 2 - user expands the turtleDB1 database
      const databaseItem = screen.getByText('turtleDB1');

      userEvent.click(databaseItem);
      userEvent.keyboard('[ArrowRight]');

      expect(screen.getByText('turtleDB1Coll1')).to.be.visible;

      // step 2 - user collapses the turtleDB1 database
      userEvent.click(databaseItem);
      userEvent.keyboard('[ArrowLeft]');

      expect(screen.queryByText('turtleDB1Coll1')).not.to.exist;
    });
  });
});
