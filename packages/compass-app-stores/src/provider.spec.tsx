import React from 'react';
import {
  NamespaceProvider,
  MongoDBInstancesManagerProvider,
  TestMongoDBInstanceManager,
} from './provider';
import { expect } from 'chai';
import Sinon from 'sinon';
import {
  renderWithActiveConnection,
  screen,
  cleanup,
  waitFor,
} from '@mongodb-js/compass-connections/test';

describe('NamespaceProvider', function () {
  const sandbox = Sinon.createSandbox();

  afterEach(function () {
    cleanup();
    sandbox.reset();
  });

  it('should immediately render content if database exists', async function () {
    const instanceManager = new TestMongoDBInstanceManager({
      databases: [{ _id: 'foo' }] as any,
    });
    await renderWithActiveConnection(
      <MongoDBInstancesManagerProvider value={instanceManager}>
        <NamespaceProvider namespace="foo">hello</NamespaceProvider>
      </MongoDBInstancesManagerProvider>
    );
    expect(screen.getByText('hello')).to.exist;
  });

  it('should immediately render content if collection exists', async function () {
    const instanceManager = new TestMongoDBInstanceManager({
      databases: [{ _id: 'foo', collections: [{ _id: 'foo.bar' }] }] as any,
    });
    await renderWithActiveConnection(
      <MongoDBInstancesManagerProvider value={instanceManager}>
        <NamespaceProvider namespace="foo.bar">hello</NamespaceProvider>
      </MongoDBInstancesManagerProvider>
    );
    expect(screen.getByText('hello')).to.exist;
  });

  it("should not render content when namespace doesn't exist", async function () {
    const instanceManager = new TestMongoDBInstanceManager();
    await renderWithActiveConnection(
      <MongoDBInstancesManagerProvider value={instanceManager}>
        <NamespaceProvider namespace="foo.bar">hello</NamespaceProvider>
      </MongoDBInstancesManagerProvider>
    );
    expect(screen.queryByText('hello')).to.not.exist;
  });

  it('should render content eventually if namespace is resolved async', async function () {
    const instanceManager = new TestMongoDBInstanceManager();
    const instance = instanceManager.getMongoDBInstanceForConnection();
    sandbox.stub(instance, 'fetchDatabases').callsFake(() => {
      instance.databases.add({ _id: 'foo' });
      return Promise.resolve();
    });

    await renderWithActiveConnection(
      <MongoDBInstancesManagerProvider value={instanceManager}>
        <NamespaceProvider namespace="foo">hello</NamespaceProvider>
      </MongoDBInstancesManagerProvider>
    );

    expect(screen.queryByText('hello')).to.not.exist;

    await waitFor(function () {
      expect(screen.queryByText('hello')).to.exist;
    });
  });

  it("should call onNamespaceFallbackSelect with database namespace if collection doesn't exist but database does", async function () {
    const onNamespaceFallbackSelect = sandbox.spy();
    const instanceManager = new TestMongoDBInstanceManager({
      databases: [{ _id: 'foo' }] as any,
    });
    await renderWithActiveConnection(
      <MongoDBInstancesManagerProvider value={instanceManager}>
        <NamespaceProvider
          namespace="foo.bar"
          onNamespaceFallbackSelect={onNamespaceFallbackSelect}
        >
          hello
        </NamespaceProvider>
      </MongoDBInstancesManagerProvider>
    );
    await waitFor(() => {
      expect(onNamespaceFallbackSelect).to.be.calledOnceWithExactly('foo');
    });
  });

  it('should call onNamespaceFallbackSelect with `null` if namespace is not found', async function () {
    const onNamespaceFallbackSelect = sandbox.spy();
    const instanceManager = new TestMongoDBInstanceManager();
    await renderWithActiveConnection(
      <MongoDBInstancesManagerProvider value={instanceManager}>
        <NamespaceProvider
          namespace="foo.bar"
          onNamespaceFallbackSelect={onNamespaceFallbackSelect}
        >
          hello
        </NamespaceProvider>
      </MongoDBInstancesManagerProvider>
    );
    await waitFor(() => {
      expect(onNamespaceFallbackSelect).to.be.calledOnceWithExactly(null);
    });
  });
});
