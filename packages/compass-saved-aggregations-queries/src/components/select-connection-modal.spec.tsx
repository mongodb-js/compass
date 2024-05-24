import Sinon from 'sinon';
import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, cleanup } from '@testing-library/react';
import { configureStore } from '../stores/index';
import { AppRegistry } from 'hadron-app-registry';
import {
  type LoggerAndTelemetry,
  createNoopLoggerAndTelemetry,
} from '@mongodb-js/compass-logging/provider';
import {
  ConnectionsManager,
  TEST_CONNECTION_INFO,
} from '@mongodb-js/compass-connections/provider';
import {
  type MongoDBInstance,
  type MongoDBInstancesManager,
  TestMongoDBInstanceManager,
} from '@mongodb-js/compass-app-stores/provider';
import {
  type PreferencesAccess,
  createSandboxFromDefaultPreferences,
} from 'compass-preferences-model';
import {
  type FavoriteQueryStorage,
  type PipelineStorage,
} from '@mongodb-js/my-queries-storage/provider';
import { type WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import { expect } from 'chai';
import {
  openNoActiveConnectionsModal,
  openSavedItem,
} from '../stores/open-item';
import { fetchItems } from '../stores/aggregations-queries-items';
import SelectConnectionModal from './select-connection-modal';

describe('SelectConnectionModal', function () {
  const sandbox = Sinon.createSandbox();
  let store: ReturnType<typeof configureStore>;
  let preferencesAccess: PreferencesAccess;
  let connectionsManager: ConnectionsManager;
  let instancesManager: MongoDBInstancesManager;
  let pipelineStorage: PipelineStorage;
  let favoriteQueryStorage: FavoriteQueryStorage;
  let workspaces: WorkspacesService;
  let logger: LoggerAndTelemetry;
  let instance: MongoDBInstance;
  let query: any;
  const globalAppRegistry = new AppRegistry();

  const renderModal = async () => {
    store = configureStore({
      connectionsManager,
      globalAppRegistry,
      logger,
      instancesManager,
      preferencesAccess,
      pipelineStorage,
      favoriteQueryStorageAccess: {
        getStorage() {
          return favoriteQueryStorage;
        },
      },
      workspaces,
    });

    render(
      <Provider store={store}>
        <SelectConnectionModal />
      </Provider>
    );

    await store.dispatch(fetchItems());
  };
  beforeEach(async function () {
    preferencesAccess = await createSandboxFromDefaultPreferences();
    await preferencesAccess.savePreferences({
      enableNewMultipleConnectionSystem: true,
    });
    logger = createNoopLoggerAndTelemetry();
    connectionsManager = new ConnectionsManager({
      logger: logger.log.unbound,
    });
    instancesManager = new TestMongoDBInstanceManager();
    pipelineStorage = {
      loadAll() {
        return [];
      },
    } as unknown as PipelineStorage;

    favoriteQueryStorage = {
      loadAll() {
        return [];
      },
    } as unknown as FavoriteQueryStorage;

    workspaces = {
      openCollectionWorkspace() {},
    } as unknown as WorkspacesService;

    query = {
      _id: '123',
      _name: 'Query',
      _ns: 'bar.foo',
      _dateSaved: new Date(),
    };
    sandbox.stub(favoriteQueryStorage, 'loadAll').resolves([query]);
    instance = {
      getNamespace() {
        return null;
      },
      fetchDatabases() {
        return [];
      },
      databases: {
        get() {
          return null;
        },
      },
    } as unknown as MongoDBInstance;
    sandbox
      .stub(connectionsManager, 'getDataServiceForConnection')
      .returns({} as any);
    sandbox
      .stub(instancesManager, 'getMongoDBInstanceForConnection')
      .returns(instance);
  });

  afterEach(function () {
    sandbox.restore();
    cleanup();
  });

  it('does not open then modal when the type is a mismatch', async function () {
    await renderModal();
    expect(() => screen.getByTestId('select-connection-modal')).to.throw;

    // Still nothing
    store.dispatch(openNoActiveConnectionsModal());
    expect(() => screen.getByTestId('select-connection-modal')).to.throw;
  });

  it('opens the modal when there are multiple connections having the namespace', async function () {
    // const openCollectionWorkspaceSpy = sandbox.spy(
    //   workspaces,
    //   'openCollectionWorkspace'
    // );
    sandbox.stub(instance, 'getNamespace').resolves({} as any);

    await renderModal();
    await store.dispatch(
      openSavedItem('123', [
        TEST_CONNECTION_INFO,
        {
          id: 'TEST-2',
          connectionOptions: {
            connectionString: 'mongodb://localhost:27021',
          },
        },
      ])
    );

    expect(screen.getByTestId('select-connection-modal')).to.exist;
    // Radio items
    expect(screen.getByText('localhost:27020')).to.exist;
    expect(screen.getByText('localhost:27021')).to.exist;
  });
});
