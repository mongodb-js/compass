import React from 'react';
import Sinon from 'sinon';
import { expect } from 'chai';
import { RenameCollectionPlugin } from '..';
import type { RenderWithConnectionsResult } from '@mongodb-js/testing-library-compass';
import {
  render,
  cleanup,
  screen,
  waitFor,
} from '@mongodb-js/testing-library-compass';

describe('RenameCollectionPlugin', function () {
  const sandbox = Sinon.createSandbox();
  let appRegistry: RenderWithConnectionsResult['globalAppRegistry'];
  const connections = {};
  const instanceModel = {
    databases: {
      get: function () {
        return {
          collections: [{ name: 'my-collection' }],
        };
      },
    },
  };
  const instancesManager = {
    getMongoDBInstanceForConnection: sandbox.stub().returns(instanceModel),
  };
  const favoriteQueries = {
    getStorage: () => ({
      loadAll: sandbox.stub().resolves([]),
    }),
  };
  const pipelineStorage = {
    loadAll: sandbox.stub().resolves([]),
  };
  beforeEach(function () {
    const Plugin = RenameCollectionPlugin.withMockServices({
      connections: connections as any,
      instancesManager: instancesManager as any,
      queryStorage: favoriteQueries as any,
      pipelineStorage: pipelineStorage as any,
    });

    const { globalAppRegistry } = render(<Plugin> </Plugin>);
    appRegistry = globalAppRegistry;
  });

  afterEach(function () {
    sandbox.resetHistory();
    cleanup();
  });

  it('handles the open-rename-collection event', async function () {
    appRegistry.emit(
      'open-rename-collection',
      {
        database: 'foo',
        collection: 'bar',
      },
      { connectionId: '12345' }
    );
    await waitFor(() => screen.getByText('Rename collection'));

    expect(screen.getByRole('heading', { name: 'Rename collection' })).to.exist;
  });
});
