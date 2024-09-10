import React from 'react';
import Sinon from 'sinon';
import { CreateNamespacePlugin } from '../index';
import type AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import { type DataService } from '@mongodb-js/compass-connections/provider';
import {
  type MongoDBInstance,
  TestMongoDBInstanceManager,
} from '@mongodb-js/compass-app-stores/provider';
import {
  renderWithConnections,
  cleanup,
  screen,
  waitForElementToBeRemoved,
  userEvent,
  createDefaultConnectionInfo,
  waitFor,
} from '@mongodb-js/testing-library-compass';

const mockConnections = [
  { ...createDefaultConnectionInfo(), id: '1' },
  { ...createDefaultConnectionInfo(), id: '2' },
];

describe('CreateNamespacePlugin', function () {
  const sandbox = Sinon.createSandbox();
  const instance1 = {
    on: sandbox.stub(),
    off: sandbox.stub(),
    removeListener: sandbox.stub(),
    build: { version: '999.999.999' },
    topologyDescription: { type: 'Unknown' },
  } as unknown as MongoDBInstance;
  const instance2 = {
    on: sandbox.stub(),
    off: sandbox.stub(),
    removeListener: sandbox.stub(),
    build: { version: '111.111.111' },
    topologyDescription: { type: 'Unknown' },
  } as unknown as MongoDBInstance;
  const workspaces = {
    openCollectionWorkspace() {},
  };
  let appRegistry: AppRegistry;
  let getDataService: (id: string) => DataService;

  beforeEach(async function () {
    const instancesManager = new TestMongoDBInstanceManager();
    sandbox
      .stub(instancesManager, 'getMongoDBInstanceForConnection')
      .callsFake(((id: string) => {
        if (id === '1') {
          return instance1;
        } else if (id === '2') {
          return instance2;
        }
      }) as () => MongoDBInstance);

    const Plugin = CreateNamespacePlugin.withMockServices({
      instancesManager,
      workspaces: workspaces as any,
    });
    const result = renderWithConnections(<Plugin></Plugin>, {
      connections: mockConnections,
      connectFn() {
        return {
          createCollection() {
            return Promise.resolve({} as any);
          },
          createDataKey() {
            return Promise.resolve({});
          },
          configuredKMSProviders() {
            return [];
          },
        };
      },
    });
    appRegistry = result.globalAppRegistry;
    getDataService = result.getDataServiceForConnection;
    for (const connectionInfo of mockConnections) {
      await result.connectionsStore.actions.connect(connectionInfo);
    }
  });

  afterEach(function () {
    sandbox.restore();
    sandbox.resetHistory();
    cleanup();
  });

  it('should dismiss the modal not do anything when modal is dismissed', async function () {
    const createCollectionSpy = sandbox.spy(
      getDataService('1'),
      'createCollection'
    );
    appRegistry.emit('open-create-database', { connectionId: '1' });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create Database' })).to.exist;
    });

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitForElementToBeRemoved(
      screen.queryByRole('heading', { name: 'Create Database' })
    );
    expect(createCollectionSpy).to.not.be.called;
  });

  context('when we are trying to create a database', function () {
    it('should should throw when emitted event does not carry connectionId', function () {
      expect(() => appRegistry.emit('open-create-database')).to.throw();
      expect(() =>
        screen.getByRole('heading', { name: 'Create Database' })
      ).to.throw();
    });

    it('should handle create database flow on `open-create-database` event', async function () {
      const emitSpy = sandbox.spy(appRegistry, 'emit');
      const createCollectionSpy = sandbox.spy(
        getDataService('1'),
        'createCollection'
      );
      const openCollectionWorkspaceSpy = sandbox.spy(
        workspaces,
        'openCollectionWorkspace'
      );
      appRegistry.emit('open-create-database', { connectionId: '1' });

      expect(screen.getByRole('heading', { name: 'Create Database' })).to.exist;

      userEvent.type(
        screen.getByRole('textbox', { name: 'Database Name' }),
        'db'
      );

      userEvent.type(
        screen.getByRole('textbox', { name: 'Collection Name' }),
        'coll1'
      );

      userEvent.click(screen.getByRole('button', { name: 'Create Database' }));

      await waitForElementToBeRemoved(
        screen.queryByRole('heading', { name: 'Create Database' })
      );

      expect(createCollectionSpy).to.have.been.calledOnceWith('db.coll1', {});

      expect(openCollectionWorkspaceSpy).to.have.been.called.calledOnceWith(
        '1',
        'db.coll1'
      );

      expect(emitSpy.secondCall).to.have.been.calledWithExactly(
        'collection-created',
        'db.coll1',
        { connectionId: '1' }
      );
    });
  });

  context('when we are trying to create a collection', function () {
    it('should should throw when emitted event does not carry connectionId', function () {
      expect(() =>
        appRegistry.emit('open-create-collection', { database: 'db' })
      ).to.throw();
      expect(() =>
        screen.getByRole('heading', { name: 'Create Collection' })
      ).to.throw();
    });

    it('should handle create collection flow on `open-create-collection` event', async function () {
      const emitSpy = sandbox.spy(appRegistry, 'emit');
      const createCollectionSpy = sandbox.spy(
        getDataService('2'),
        'createCollection'
      );
      const openCollectionWorkspaceSpy = sandbox.spy(
        workspaces,
        'openCollectionWorkspace'
      );
      appRegistry.emit(
        'open-create-collection',
        { database: 'db' },
        { connectionId: '2' }
      );

      expect(
        screen.getByRole('heading', { name: 'Create Collection' })
      ).to.exist;

      expect(
        screen.queryByRole('textbox', { name: 'Database Name' })
      ).to.not.exist;

      userEvent.type(
        screen.getByRole('textbox', { name: 'Collection Name' }),
        'coll2'
      );

      userEvent.click(
        screen.getByRole('button', { name: 'Create Collection' })
      );

      await waitForElementToBeRemoved(
        screen.queryByRole('heading', { name: 'Create Collection' })
      );

      expect(createCollectionSpy).to.have.been.calledOnceWith('db.coll2', {});

      expect(openCollectionWorkspaceSpy).to.have.been.called.calledOnceWith(
        '2',
        'db.coll2'
      );

      expect(emitSpy.secondCall).to.have.been.calledWithExactly(
        'collection-created',
        'db.coll2',
        { connectionId: '2' }
      );
    });
  });
});
