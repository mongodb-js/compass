import React from 'react';
import { expect } from 'chai';
import { act, render, screen, waitFor } from '@testing-library/react';
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

  constructor(name = 'connection') {
    super();
    this._id = name;
    this.status = 'ready';
    this.databasesStatus = 'ready';
    this.databases = [
      {
        _id: `${name}DB1`,
        name: `${name}DB1`,
        status: 'ready',
        collectionsLength: 1,
        collectionsStatus: 'ready',
        collections: [
          {
            _id: `${name}DB1Coll1`,
            name: `${name}DB1Coll1`,
            type: 'collection',
          },
          {
            _id: `${name}DB1Coll2`,
            name: `${name}DB1Coll2`,
            type: 'collection',
          },
        ],
      },
      {
        _id: `${name}DB2`,
        name: `${name}DB2`,
        status: 'ready',
        collectionsLength: 1,
        collectionsStatus: 'ready',
        collections: [
          {
            _id: `${name}DB2Coll`,
            name: `${name}DB2Coll1`,
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
      connectionString: 'mongodb://oranges',
    },
    savedConnectionType: 'favorite',
  },
];

describe('<ActiveConnectionNavigation />', function () {
  let connectionsManager: ConnectionsManager;
  let preferences: PreferencesAccess;
  let store: ReturnType<typeof createSidebarStore>['store'];
  let turtleInstance: EventEmitter;
  let orangeInstance: EventEmitter;
  let dataService: DataService;
  let dataServiceCurrentOp = sinon.stub().resolves();
  let deactivate: () => void;
  const globalAppRegistry = new AppRegistry();
  const onOpenConnectionInfoStub = sinon.stub();
  const onCopyConnectionStringStub = sinon.stub();
  const onToggleFavoriteConnectionStub = sinon.stub();
  const onDisconnectStub = sinon.stub();
  const openPerformanceWorkspaceStub = sinon.stub();
  const onFilterChangeStub = sinon.stub();

  const renderActiveConnectionsNavigation = async ({
    activeWorkspace = {
      type: 'Databases',
      connectionId: 'turtle',
      id: '12345',
    },
    filterRegex = null,
  }: {
    activeWorkspace?: WorkspaceTab;
    filterRegex?: RegExp | null;
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
    turtleInstance = new MockInstance('turtle');
    orangeInstance = new MockInstance('orange');
    connectionsManager = new ConnectionsManager({} as any);
    (connectionsManager as any).getDataServiceForConnection = () => dataService;
    (connectionsManager as any).connectionStatuses.set('turtle', 'connected');
    (connectionsManager as any).connectionStatuses.set('oranges', 'connected');
    ({ store, deactivate } = createSidebarStore(
      {
        globalAppRegistry,
        instancesManager: {
          listMongoDBInstances() {
            return new Map([
              ['turtle', turtleInstance],
              ['oranges', orangeInstance],
            ]);
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

    const props = {
      activeConnections: mockConnections,
      activeWorkspace: activeWorkspace,
      onOpenConnectionInfo: onOpenConnectionInfoStub,
      onCopyConnectionString: onCopyConnectionStringStub,
      onDisconnect: onDisconnectStub,
      onToggleFavoriteConnection: onToggleFavoriteConnectionStub,
      onFilterChange: onFilterChangeStub,
      filterRegex: filterRegex,
    };

    const wrapper = ({
      children,
    }: {
      children: React.ReactChild;
    }): React.ReactElement => (
      <PreferencesProvider value={preferences}>
        <WorkspacesServiceProvider
          value={
            {
              openPerformanceWorkspace: openPerformanceWorkspaceStub,
              openCollectionsWorkspace: sinon.stub(),
              openCollectionWorkspace: sinon.stub(),
              openDatabasesWorkspace: sinon.stub(),
              openEditViewWorkspace: sinon.stub(),
            } as unknown as WorkspacesService
          }
        >
          <ConnectionsManagerProvider value={connectionsManager}>
            <Provider store={store}>{children}</Provider>
          </ConnectionsManagerProvider>
        </WorkspacesServiceProvider>
      </PreferencesProvider>
    );

    const renderResult = render(<ActiveConnectionNavigation {...props} />, {
      wrapper,
    });
    return {
      rerender: (props: any) =>
        renderResult.rerender(<ActiveConnectionNavigation {...props} />),
      props,
    };
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

    it('Calls onDisconnect', async () => {
      userEvent.hover(screen.getByText('turtle'));

      const connectionActionsBtn = screen.getByTitle('Show actions');
      expect(connectionActionsBtn).to.be.visible;

      userEvent.click(connectionActionsBtn);

      const disconnectBtn = await screen.findByText('Disconnect');
      expect(disconnectBtn).to.be.visible;

      userEvent.click(disconnectBtn);

      expect(onDisconnectStub).to.have.been.calledWith('turtle');
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
      const { rerender, props } = await renderActiveConnectionsNavigation({
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
      rerender({
        ...props,
        activeWorkspace: {
          type: 'Collections',
          connectionId: 'turtle',
          namespace: 'db1',
        } as WorkspaceTab,
      });

      expect(screen.getByText('turtleDB1')).to.be.visible;
    });

    it('should expand a database when a child workspace is entered', async function () {
      // step 1 - turtleDB1 is collapsed at first
      const { rerender, props } = await renderActiveConnectionsNavigation({
        activeWorkspace: { type: 'My Queries', id: 'abcd' },
      });

      turtleInstance.emit('change:databasesStatus');

      expect(screen.queryByText('turtleDB1Coll1')).not.to.exist;

      // step 2 - user entered a workspace that belongs to the turtleDB1 database
      rerender({
        ...props,
        activeWorkspace: {
          type: 'Collection',
          connectionId: 'turtle',
          namespace: 'turtleDB1.turtleDB1Coll1',
        } as WorkspaceTab,
      });

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

  describe('Filtering', () => {
    it('Should filter the connections', async () => {
      await renderActiveConnectionsNavigation({ filterRegex: /orange/i });

      expect(screen.queryByText('oranges')).to.be.visible;
      expect(screen.queryByText('turtle')).not.to.exist;
    });

    it('Should filter the databases', async () => {
      await renderActiveConnectionsNavigation({ filterRegex: /orangeDB2/i });

      expect(screen.queryByText('oranges')).to.be.visible;
      expect(screen.queryByText('turtle')).not.to.exist;

      expect(screen.queryByText('orangeDB2')).to.be.visible;
      expect(screen.queryByText('orangeDB1')).not.to.exist;
    });

    it('Should filter the databases, expanding the connection (until the filter is cleared)', async () => {
      // step 1 - connection is expanded at first
      const { rerender, props } = await renderActiveConnectionsNavigation();

      // step 2 - user collapses the connection
      act(() => {
        userEvent.click(screen.getByText('oranges'));
        userEvent.keyboard('[ArrowLeft]');
      });

      expect(screen.queryByText('orangeDB2')).not.to.exist;

      // step 3 - we filter for a database
      rerender({
        ...props,
        filterRegex: /orangeDB2/,
      });

      expect(screen.queryByText('orangeDB2')).to.be.visible;

      // step 4 - user clears the filter
      rerender({
        ...props,
        filterRegex: null,
      });

      expect(screen.queryByText('orangeDB2')).not.to.exist;
    });

    it('Should filter the databases, expanding the connection (but the user can still collapse it)', async () => {
      // step 1 - connection is expanded at first
      const { rerender, props } = await renderActiveConnectionsNavigation();

      // step 2 - user collapses the connection
      act(() => {
        userEvent.click(screen.getByText('oranges'));
        userEvent.keyboard('[ArrowLeft]');
      });

      expect(screen.queryByText('orangeDB2')).not.to.exist;

      // step 3 - we filter for a database
      rerender({
        ...props,
        filterRegex: /orangeDB2/,
      });

      expect(screen.queryByText('orangeDB2')).to.be.visible;

      // step 4 - user collapses the connection
      act(() => {
        userEvent.click(screen.getByText('oranges'));
        userEvent.keyboard('[ArrowLeft]');
      });

      expect(screen.queryByText('orangeDB2')).not.to.exist;
    });

    it('Should filter the collections, expanding the database (until the filter is cleared)', async () => {
      // step 1 - filtering for the collection expands the database
      const { rerender, props } = await renderActiveConnectionsNavigation({
        filterRegex: /orangeDB1Coll2/i,
      });

      expect(screen.queryByText('oranges')).to.be.visible;
      expect(screen.queryByText('turtle')).not.to.exist;

      expect(screen.queryByText('orangeDB1')).to.be.visible;
      expect(screen.queryByText('orangeDB2')).not.to.exist;

      expect(screen.queryByText('orangeDB1Coll2')).to.be.visible;
      expect(screen.queryByText('orangeDB1Coll1')).not.to.exist;

      // step 2 - clearing the filter
      rerender({
        ...props,
        filterRegex: null,
      });
      expect(screen.queryByText('orangeDB1Coll2')).not.to.be.exist;
    });

    it('Should filter the collections, expanding the database (but the user can still collapse it)', async () => {
      // step 1 - filtering for the collection expands the database
      await renderActiveConnectionsNavigation({
        filterRegex: /orangeDB1Coll2/i,
      });

      expect(screen.queryByText('orangeDB1Coll2')).to.be.visible;

      // step 2 - user collapses the database
      act(() => {
        userEvent.click(screen.getByText('orangeDB1'));
        userEvent.keyboard('[ArrowLeft]');
      });
      expect(screen.queryByText('orangeDB1Coll2')).not.to.be.exist;
    });
  });
});
