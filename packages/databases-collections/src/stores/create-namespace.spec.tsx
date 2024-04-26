import React from 'react';
import Sinon from 'sinon';
import { CreateNamespacePlugin } from '../index';
import AppRegistry from 'hadron-app-registry';
import {
  render,
  cleanup,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import {
  ConnectionsManager,
  type DataService,
} from '@mongodb-js/compass-connections/provider';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import {
  type MongoDBInstance,
  TestMongoDBInstanceManager,
} from '@mongodb-js/compass-app-stores/provider';

describe('CreateNamespacePlugin', function () {
  const sandbox = Sinon.createSandbox();
  const appRegistry = sandbox.spy(new AppRegistry());
  const dataService1 = {
    createCollection() {
      return Promise.resolve({});
    },
    createDataKey() {
      return Promise.resolve({});
    },
    configuredKMSProviders() {
      return Promise.resolve([]);
    },
  } as unknown as DataService;
  const dataService2 = {
    createCollection() {
      return Promise.resolve({});
    },
    createDataKey() {
      return Promise.resolve({});
    },
    configuredKMSProviders() {
      return Promise.resolve([]);
    },
  } as unknown as DataService;
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
  const connectionScopedAppRegistry = {
    emit() {},
  };

  beforeEach(function () {
    const connectionsManager = new ConnectionsManager({
      logger: createNoopLoggerAndTelemetry().log.unbound,
    });
    sandbox
      .stub(connectionsManager, 'getDataServiceForConnection')
      .callsFake((id) => {
        if (id === '1') {
          return dataService1;
        } else if (id === '2') {
          return dataService2;
        }
      });

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
      globalAppRegistry: appRegistry,
      connectionsManager,
      instancesManager,
      workspaces: workspaces as any,
      connectionScopedAppRegistry,
    });
    render(<Plugin></Plugin>);
  });

  afterEach(function () {
    sandbox.restore();
    sandbox.resetHistory();
    cleanup();
  });

  it('should dismiss the modal not do anything when modal is dismissed', async function () {
    const createCollectionSpy = sandbox.spy(dataService1, 'createCollection');
    appRegistry.emit('open-create-database', { connectionId: '1' });
    expect(screen.getByRole('heading', { name: 'Create Database' })).to.exist;

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitForElementToBeRemoved(
      screen.queryByRole('heading', { name: 'Create Database' })
    );
    expect(createCollectionSpy).to.not.be.called;
  });

  context('when we are trying to create a database', function () {
    it('should not do anything if the emitted event does not carry a connectionId', function () {
      appRegistry.emit('open-create-database');
      expect(() =>
        screen.getByRole('heading', { name: 'Create Database' })
      ).to.throw;
    });

    it('should handle create database flow on `open-create-database` event', async function () {
      const emitSpy = sandbox.spy(connectionScopedAppRegistry, 'emit');
      const createCollectionSpy = sandbox.spy(dataService1, 'createCollection');
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

      expect(emitSpy).to.have.been.calledOnceWithExactly(
        'collection-created',
        'db.coll1'
      );
    });
  });

  context('when we are trying to create a collection', function () {
    it('should do nothing if the emitted event does not carry a connectionId', function () {
      appRegistry.emit('open-create-collection', { database: 'db' });
      expect(() =>
        screen.getByRole('heading', { name: 'Create Collection' })
      ).to.throw;
    });

    it('should handle create collection flow on `open-create-collection` event', async function () {
      const emitSpy = sandbox.spy(connectionScopedAppRegistry, 'emit');
      const createCollectionSpy = sandbox.spy(dataService2, 'createCollection');
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

      expect(emitSpy).to.have.been.calledOnceWithExactly(
        'collection-created',
        'db.coll2'
      );
    });
  });
});
