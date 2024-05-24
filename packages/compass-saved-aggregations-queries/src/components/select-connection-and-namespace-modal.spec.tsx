import Sinon from 'sinon';
import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
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
import SelectConnectionAndNamespaceModal from './select-connection-and-namespace-modal';
import { expect } from 'chai';
import {
  openNoActiveConnectionsModal,
  openSavedItem,
  openSelectConnectionAndNamespaceModal,
} from '../stores/open-item';
import { fetchItems } from '../stores/aggregations-queries-items';

describe('SelectConnectionAndNamespaceModal', function () {
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
        <SelectConnectionAndNamespaceModal />
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
    expect(() => screen.getByTestId('open-item-modal')).to.throw;

    // Still nothing
    store.dispatch(openNoActiveConnectionsModal());
    expect(() => screen.getByTestId('open-item-modal')).to.throw;
  });

  context('when connected to only one connection', function () {
    it('opens the namespace-not-found-modal when the namespace is not found in the active connection', async function () {
      sandbox.stub(instance, 'getNamespace').resolves(null);
      await renderModal();
      await store.dispatch(openSavedItem('123', [TEST_CONNECTION_INFO]));

      await waitFor(() => {
        expect(screen.getByTestId('open-item-modal')).to.exist;
      });

      // We don't show the connection select when connected to only one connection
      expect(screen.getByText('Select a Namespace')).to.exist;

      // Description will be there in case of namespace-not-found-modal
      expect(screen.getByTestId('description')).to.exist;

      // We won't show connection select when connected to only one connection
      expect(() => screen.getByTestId('connection-select')).to.throw;

      expect(screen.getByTestId('database-select')).to.exist;
      expect(screen.getByTestId('collection-select')).to.exist;
    });

    it('opens the select-connection-and-namespace-modal', async function () {
      await renderModal();
      store.dispatch(
        openSelectConnectionAndNamespaceModal('123', [TEST_CONNECTION_INFO])
      );

      await waitFor(() => {
        expect(screen.getByTestId('open-item-modal')).to.exist;
      });

      // We don't show the connection select when connected to only one connection
      expect(screen.getByText('Select a Namespace')).to.exist;

      // Description will be not there in case of select-connection-and-namespace-modal
      expect(() => screen.getByTestId('description')).to.throw;

      // We won't show connection select when connected to only one connection
      expect(() => screen.getByTestId('connection-select')).to.throw;

      expect(screen.getByTestId('database-select')).to.exist;
      expect(screen.getByTestId('collection-select')).to.exist;
    });

    it('opens the collection right away when the namespace is found in the active connection', async function () {
      const openCollectionWorkspaceSpy = sandbox.spy(
        workspaces,
        'openCollectionWorkspace'
      );
      sandbox.stub(instance, 'getNamespace').resolves({} as any);
      await renderModal();
      await store.dispatch(openSavedItem('123', [TEST_CONNECTION_INFO]));

      expect(() => screen.getByTestId('open-item-modal')).to.throw;

      expect(openCollectionWorkspaceSpy).to.be.calledOnceWithExactly(
        `${TEST_CONNECTION_INFO.id}`,
        'bar.foo',
        {
          initialAggregation: undefined,
          initialQuery: query,
          newTab: true,
        }
      );
    });
  });

  context('when connected to multiple connections', function () {
    it('opens the namespace-not-found-modal when the namespace is not found any connection', async function () {
      sandbox.stub(instance, 'getNamespace').resolves(null);
      await renderModal();
      await store.dispatch(
        openSavedItem('123', [
          TEST_CONNECTION_INFO,
          {
            ...TEST_CONNECTION_INFO,
            id: 'TEST-2',
          },
        ])
      );

      await waitFor(() => {
        expect(screen.getByTestId('open-item-modal')).to.exist;
      });

      expect(screen.getByText('Select a Connection and Namespace')).to.exist;

      // Description will be there in case of namespace-not-found-modal
      expect(screen.getByTestId('description')).to.exist;

      expect(screen.getByTestId('connection-select')).to.exist;
      expect(screen.getByTestId('database-select')).to.exist;
      expect(screen.getByTestId('collection-select')).to.exist;
    });

    it('opens the select-connection-and-namespace-modal', async function () {
      await renderModal();
      store.dispatch(
        openSelectConnectionAndNamespaceModal('123', [
          TEST_CONNECTION_INFO,
          {
            ...TEST_CONNECTION_INFO,
            id: 'TEST-2',
          },
        ])
      );

      await waitFor(() => {
        expect(screen.getByTestId('open-item-modal')).to.exist;
      });

      // We don't show the connection select when connected to only one connection
      expect(screen.getByText('Select a Connection and Namespace')).to.exist;

      // Description will be not there in case of select-connection-and-namespace-modal
      expect(() => screen.getByTestId('description')).to.throw;

      // We won't show connection select when connected to only one connection
      expect(screen.getByTestId('connection-select')).to.exist;

      expect(screen.getByTestId('database-select')).to.exist;
      expect(screen.getByTestId('collection-select')).to.exist;
    });

    it('opens the query right away if the namespace is found in only of the active connections', async function () {
      const openCollectionWorkspaceSpy = sandbox.spy(
        workspaces,
        'openCollectionWorkspace'
      );
      sandbox
        .stub(instance, 'getNamespace')
        .onFirstCall()
        .resolves({} as any)
        .onSecondCall()
        .resolves(null);

      await renderModal();
      await store.dispatch(
        openSavedItem('123', [
          TEST_CONNECTION_INFO,
          {
            ...TEST_CONNECTION_INFO,
            id: 'TEST-2',
          },
        ])
      );

      expect(() => screen.getByTestId('open-item-modal')).to.throw;

      expect(openCollectionWorkspaceSpy).to.be.calledOnceWithExactly(
        `${TEST_CONNECTION_INFO.id}`,
        'bar.foo',
        {
          initialAggregation: undefined,
          initialQuery: query,
          newTab: true,
        }
      );
    });
  });
});
